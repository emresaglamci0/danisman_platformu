-- =====================================================================
-- 0004_sikayet_ve_inceleme.sql
-- Mesajlar varsayilan olarak yalnizca iki tarafa acik. Admin yalnizca isaretlenmis
-- (sikayet edilmis / incelemeye alinmis / ileride bot tarafindan isaretlenmis) sohbetleri,
-- sebep yazarak ve 30 dakikalik sureyle acabilir. Her erisim degistirilemez bir kayda yazilir.
-- 0003 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- =====================================================================

-- ---------- Isaretlenmis sohbetler ----------
-- Bir sohbet uc yoldan isaretlenebilir:
--   user_report     : taraflardan biri "Sikayet et" dedi
--   admin_review    : admin, sebep yazarak incelemeye aldi
--   auto_moderation : ILERIDE eklenecek otomatik moderasyon botu (sunucu tarafindan eklenir)
create table public.conversation_flags (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  source text not null check (source in ('user_report', 'admin_review', 'auto_moderation')),
  reported_by uuid references public.profiles (id) on delete set null,
  category text not null check (category in (
    'taciz', 'uygunsuz_icerik', 'spam', 'guvenlik_riski', 'diger', 'admin_inceleme', 'otomatik'
  )),
  note text check (char_length(note) <= 500),
  -- Otomatik moderasyon icin hazir alanlar (simdilik bos kalir)
  detector text check (char_length(detector) <= 100),        -- botun adi/surumu
  score numeric(4, 3) check (score >= 0 and score <= 1),     -- risk puani
  message_id bigint references public.messages (id) on delete set null, -- isareti tetikleyen mesaj
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  check (source <> 'auto_moderation' or detector is not null)
);
create index conversation_flags_acik on public.conversation_flags (conversation_id) where status = 'open';

-- Ayni kullanici ayni sohbeti ayni anda yalnizca bir kez sikayet edebilir
create unique index conversation_flags_tek_sikayet
  on public.conversation_flags (conversation_id, reported_by)
  where status = 'open' and source = 'user_report';

-- ---------- Admin sohbet erisim kaydi (DEGISTIRILEMEZ) ----------
-- Bilerek yabanci anahtar (foreign key) yok: kullanici veya sohbet silinse bile kayit korunur.
create table public.conversation_access_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null,
  conversation_id uuid not null,
  reason text not null check (char_length(reason) between 10 and 500),
  accessed_at timestamptz not null default now()
);
create index conversation_access_log_arama
  on public.conversation_access_log (conversation_id, admin_id, accessed_at);

-- Kayit eklendikten sonra hic kimse (gizli anahtarli sunucu dahil) degistiremez veya silemez
create function public.erisim_kaydi_degistirilemez()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Erisim kaydi degistirilemez veya silinemez';
end;
$$;

create trigger conversation_access_log_degistirilemez
  before update or delete on public.conversation_access_log
  for each row execute function public.erisim_kaydi_degistirilemez();

create trigger conversation_access_log_bosaltilamaz
  before truncate on public.conversation_access_log
  for each statement execute function public.erisim_kaydi_degistirilemez();

-- =====================================================================
-- Admin islemleri: yalnizca bu fonksiyonlar uzerinden yapilir
-- =====================================================================

-- Admin bu sohbetin mesajlarini su an okuyabilir mi?
-- Kosullar: admin olmak + sohbette acik bir isaret olmasi + son 30 dakikada sebep yazarak erisim acmis olmak
create function public.admin_sohbet_okuyabilir(p_konusma uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() = 'admin', false)
    and exists (
      select 1 from public.conversation_flags f
      where f.conversation_id = p_konusma and f.status = 'open'
    )
    and exists (
      select 1 from public.conversation_access_log l
      where l.conversation_id = p_konusma
        and l.admin_id = auth.uid()
        and l.accessed_at > now() - interval '30 minutes'
    );
$$;

-- Admin, isaretli bir sohbete sebep yazarak 30 dakikalik erisim acar. Erisim kaydedilir.
create function public.konusma_erisimi_ac(p_konusma uuid, p_sebep text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  if char_length(trim(coalesce(p_sebep, ''))) < 10 or char_length(p_sebep) > 500 then
    raise exception 'SEBEP_GECERSIZ';
  end if;
  if not exists (
    select 1 from public.conversation_flags
    where conversation_id = p_konusma and status = 'open'
  ) then
    raise exception 'ISARET_YOK';
  end if;

  insert into public.conversation_access_log (admin_id, conversation_id, reason)
  values (auth.uid(), p_konusma, trim(p_sebep));

  return now() + interval '30 minutes';
end;
$$;

-- Admin, (ornegin disaridan gelen bir bildirim uzerine) bir sohbeti sebep yazarak incelemeye alir.
-- Bu islem mesajlari ACMAZ; acmak icin ayrica konusma_erisimi_ac gerekir.
create function public.incelemeye_al(p_konusma uuid, p_sebep text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  if char_length(trim(coalesce(p_sebep, ''))) < 10 or char_length(p_sebep) > 500 then
    raise exception 'SEBEP_GECERSIZ';
  end if;
  if not exists (select 1 from public.conversations where id = p_konusma) then
    raise exception 'SOHBET_YOK';
  end if;

  insert into public.conversation_flags (conversation_id, source, reported_by, category, note)
  values (p_konusma, 'admin_review', auth.uid(), 'admin_inceleme', trim(p_sebep))
  returning id into v_id;
  return v_id;
end;
$$;

-- Admin bir isareti kapatir (inceleme bitti). Acik isaret kalmazsa admin erisimi de biter.
create function public.isaret_kapat(p_isaret uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  update public.conversation_flags
  set status = 'closed', closed_at = now(), closed_by = auth.uid()
  where id = p_isaret and status = 'open';
end;
$$;

revoke execute on function public.admin_sohbet_okuyabilir(uuid) from public, anon;
revoke execute on function public.konusma_erisimi_ac(uuid, text) from public, anon;
revoke execute on function public.incelemeye_al(uuid, text) from public, anon;
revoke execute on function public.isaret_kapat(uuid) from public, anon;
revoke execute on function public.erisim_kaydi_degistirilemez() from public, anon, authenticated;
grant execute on function public.admin_sohbet_okuyabilir(uuid) to authenticated;
grant execute on function public.konusma_erisimi_ac(uuid, text) to authenticated;
grant execute on function public.incelemeye_al(uuid, text) to authenticated;
grant execute on function public.isaret_kapat(uuid) to authenticated;

-- =====================================================================
-- Erisim izinleri ve RLS
-- =====================================================================
revoke all on public.conversation_flags, public.conversation_access_log from anon, authenticated;
grant select on public.conversation_flags to authenticated;
grant insert (conversation_id, source, reported_by, category, note) on public.conversation_flags to authenticated;
grant select on public.conversation_access_log to authenticated;

alter table public.conversation_flags enable row level security;
alter table public.conversation_access_log enable row level security;

-- Taraflar sohbeti sikayet edebilir (yalnizca kendi adina, yalnizca kullanici kategorileriyle)
create policy "taraf sohbeti sikayet eder" on public.conversation_flags
  for insert to authenticated
  with check (
    source = 'user_report'
    and reported_by = auth.uid()
    and category in ('taciz', 'uygunsuz_icerik', 'spam', 'guvenlik_riski', 'diger')
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.client_id = auth.uid() or c.expert_id = auth.uid())
    )
  );

-- Kullanici kendi sikayetlerini, admin tum isaretleri gorur
create policy "sikayeti sahibi ve admin gorur" on public.conversation_flags
  for select to authenticated
  using (reported_by = auth.uid() or public.my_role() = 'admin');

-- Erisim kaydini yalnizca admin gorur (ekleme yalnizca konusma_erisimi_ac ile)
create policy "erisim kaydini admin gorur" on public.conversation_access_log
  for select to authenticated
  using (public.my_role() = 'admin');

-- ---------- Admin'in genel okuma yetkisi KALDIRILIR ----------
drop policy "konusmayi taraflar ve admin gorur" on public.conversations;
drop policy "mesajlari taraflar ve admin okur" on public.messages;

create policy "konusmayi taraflar gorur" on public.conversations
  for select to authenticated
  using (client_id = auth.uid() or expert_id = auth.uid());

-- Admin yalnizca isaretlenmis sohbetlerin kimler arasinda oldugunu gorur (mesajlari degil)
create policy "admin isaretli konusmayi gorur" on public.conversations
  for select to authenticated
  using (
    public.my_role() = 'admin'
    and exists (select 1 from public.conversation_flags f where f.conversation_id = conversations.id)
  );

create policy "mesajlari taraflar okur" on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.client_id = auth.uid() or c.expert_id = auth.uid())
  ));

-- Admin mesajlari yalnizca isaretli sohbette, sebep yazarak actigi 30 dakika icinde okur
create policy "admin erisim acilan sohbeti okur" on public.messages
  for select to authenticated
  using (public.admin_sohbet_okuyabilir(conversation_id));
