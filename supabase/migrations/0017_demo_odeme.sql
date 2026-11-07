-- =====================================================================
-- 0017_demo_odeme.sql
-- Demo odeme, bekletme ve yonetici karari. GERCEK PARA HAREKETI YOKTUR, kart bilgisi alinmaz.
--
--   - Odeme, seans bitiminden 48 saat sonrasina kadar bekletilir, sonra uzmana aktarilmis sayilir.
--   - Danisan bu surede "Seans yapilmadi" diyebilir; yonetici iade veya aktarim karari verir.
--   - Bu dosya seans tablosuna yalnizca tetikleyiciyle baglanir. Odeme kaldirilirsa seanslar bozulmaz.
--
-- 0016 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

create table if not exists public.demo_payments (
  session_offer_id uuid primary key references public.session_offers (id) on delete cascade,
  amount_kurus int not null check (amount_kurus > 0),
  commission_kurus int not null check (commission_kurus >= 0),
  expert_net_kurus int not null check (expert_net_kurus >= 0),
  status text not null check (status in ('held', 'in_review', 'transferred', 'refunded')),
  paid_at timestamptz not null default now(),
  settled_at timestamptz,
  check (commission_kurus + expert_net_kurus = amount_kurus)
);

revoke all on public.demo_payments from anon, authenticated;
grant select on public.demo_payments to authenticated;
alter table public.demo_payments enable row level security;
drop policy if exists "taraflar demo odemeyi gorur" on public.demo_payments;
create policy "taraflar demo odemeyi gorur" on public.demo_payments
  for select to authenticated
  using (exists (
    select 1 from public.session_offers o
    where o.id = session_offer_id and (o.client_id = auth.uid() or o.expert_id = auth.uid())
  ));

-- ---------- Odeme ----------
create or replace function public.demo_odeme_yap(p_plan uuid, p_danisan uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.session_offers;
  v_komisyon int;
begin
  update public.session_offers set status = 'confirmed'
  where id = p_plan and client_id = p_danisan and status = 'awaiting_payment' and expires_at > now()
  returning * into v_plan;
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;

  v_komisyon := round(v_plan.price_kurus * 0.05);
  insert into public.demo_payments (session_offer_id, amount_kurus, commission_kurus, expert_net_kurus, status)
  values (p_plan, v_plan.price_kurus, v_komisyon, v_plan.price_kurus - v_komisyon, 'held');
end;
$$;

-- ---------- Iptal sonucu ----------
-- 24 saatten az kala danisan iptal ederse iade yoktur; diger tum iptallerde iade edilir.
create or replace function public.demo_odeme_iptal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'confirmed' and new.status = 'cancelled' then
    update public.demo_payments
    set status = case
          when new.cancelled_by = 'client' and new.starts_at - new.cancelled_at <= interval '24 hours'
            then 'transferred'
          else 'refunded'
        end,
        settled_at = now()
    where session_offer_id = new.id and status = 'held';
  end if;
  return new;
end;
$$;

drop trigger if exists session_offers_demo_odeme on public.session_offers;
create trigger session_offers_demo_odeme
  after update of status on public.session_offers
  for each row execute function public.demo_odeme_iptal();

-- ---------- Uzman hesabini silerse bekletmedeki odemeler iade edilir ----------
create or replace function public.demo_odeme_uzman_siliniyor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.demo_payments p set status = 'refunded', settled_at = now()
  from public.session_offers o
  where o.id = p.session_offer_id and o.expert_id = old.id and p.status = 'held';
  return old;
end;
$$;

drop trigger if exists expert_profiles_demo_odeme on public.expert_profiles;
create trigger expert_profiles_demo_odeme
  before delete on public.expert_profiles
  for each row execute function public.demo_odeme_uzman_siliniyor();

-- ---------- "Seans yapilmadi" ----------
-- Danisanin baska bir acik sikayeti olsa da bildirebilmesi icin tek-sikayet kurali bu sebebi kapsamaz.
drop index if exists public.conversation_flags_tek_sikayet;
create unique index conversation_flags_tek_sikayet
  on public.conversation_flags (conversation_id, reported_by)
  where status = 'open' and source = 'user_report' and category <> 'seans_yapilmadi';

create unique index if not exists conversation_flags_tek_seans
  on public.conversation_flags (session_offer_id)
  where status = 'open' and category = 'seans_yapilmadi';

create or replace function public.seans_yapilmadi_bildir(p_plan uuid, p_danisan uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.session_offers;
begin
  select * into v_plan from public.session_offers
  where id = p_plan and client_id = p_danisan and status = 'confirmed'
    and starts_at <= now() and ends_at + interval '48 hours' > now();
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;

  update public.demo_payments set status = 'in_review'
  where session_offer_id = p_plan and status = 'held';
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;

  insert into public.conversation_flags (conversation_id, source, reported_by, category, session_offer_id)
  values (v_plan.conversation_id, 'user_report', p_danisan, 'seans_yapilmadi', p_plan);
end;
$$;

-- ---------- Yonetici ----------
-- Yonetici yalnizca bu ozeti gorur; gorusme baglantisinin adresini degil, eklenip eklenmedigini.
create or replace function public.admin_seans_karti(p_isaret uuid)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  amount_kurus int,
  odeme_durumu text,
  baglanti_var boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  return query
    select o.starts_at, o.ends_at, p.amount_kurus, p.status, o.meeting_url is not null
    from public.conversation_flags f
    join public.session_offers o on o.id = f.session_offer_id
    join public.demo_payments p on p.session_offer_id = o.id
    where f.id = p_isaret and f.status = 'open' and f.category = 'seans_yapilmadi';
end;
$$;

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_action_check
  check (action in (
    'belge_goruntule', 'uzman_onayla', 'uzman_reddet', 'foto_kaldir', 'mesaj_goruntule',
    'tanitim_uygun', 'tanitim_kaldir', 'seans_iade', 'seans_aktar'
  ));

create or replace function public.seans_karari(p_isaret uuid, p_karar text, p_sebep text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seans uuid;
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  if p_karar not in ('iade', 'aktar') then
    raise exception 'KARAR_GECERSIZ';
  end if;
  if char_length(trim(coalesce(p_sebep, ''))) < 10 or char_length(p_sebep) > 500 then
    raise exception 'SEBEP_GECERSIZ';
  end if;

  update public.conversation_flags
  set status = 'closed', closed_at = now(), closed_by = auth.uid(), note = trim(p_sebep)
  where id = p_isaret and status = 'open' and category = 'seans_yapilmadi'
  returning session_offer_id into v_seans;
  if v_seans is null then
    raise exception 'ISARET_YOK';
  end if;

  update public.demo_payments
  set status = case when p_karar = 'iade' then 'refunded' else 'transferred' end, settled_at = now()
  where session_offer_id = v_seans and status = 'in_review';

  insert into public.admin_audit_log (admin_id, action, target_id)
  values (auth.uid(), case when p_karar = 'iade' then 'seans_iade' else 'seans_aktar' end, v_seans);
end;
$$;

-- Genel "incelemeyi kapat" bu isareti kapatamaz: yoksa odeme "incelemede" kalirdi
create or replace function public.isaret_kapat(p_isaret uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  if exists (select 1 from public.conversation_flags where id = p_isaret and category = 'seans_yapilmadi' and status = 'open') then
    raise exception 'KARAR_GEREKLI';
  end if;
  update public.conversation_flags
  set status = 'closed', closed_at = now(), closed_by = auth.uid()
  where id = p_isaret and status = 'open';
end;
$$;

-- ---------- Bakim: 48 saat dolan odemeler uzmana aktarilmis sayilir ----------
create or replace function public.demo_odeme_bakimi()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.demo_payments p set status = 'transferred', settled_at = now()
  from public.session_offers o
  where o.id = p.session_offer_id
    and p.status = 'held'
    and o.status = 'confirmed'
    and o.ends_at + interval '48 hours' <= now();
$$;

-- ---------- Izinler ----------
revoke execute on function public.demo_odeme_yap(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.demo_odeme_iptal() from public, anon, authenticated;
revoke execute on function public.demo_odeme_uzman_siliniyor() from public, anon, authenticated;
revoke execute on function public.seans_yapilmadi_bildir(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.demo_odeme_bakimi() from public, anon, authenticated;
revoke execute on function public.admin_seans_karti(uuid) from public, anon;
revoke execute on function public.seans_karari(uuid, text, text) from public, anon;

grant execute on function public.demo_odeme_yap(uuid, uuid) to service_role;
grant execute on function public.seans_yapilmadi_bildir(uuid, uuid) to service_role;
grant execute on function public.admin_seans_karti(uuid) to authenticated;
grant execute on function public.seans_karari(uuid, text, text) to authenticated;

select cron.schedule('demo-odeme-bakimi', '10 * * * *', $$select public.demo_odeme_bakimi();$$);
