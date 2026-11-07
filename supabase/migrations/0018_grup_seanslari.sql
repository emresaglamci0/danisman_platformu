-- =====================================================================
-- 0018_grup_seanslari.sql
-- Grupla psikolojik danisma. Yalnizca bagimsiz uzman acar, ogrenci uzmana kapalidir.
--
--   - En az 3, en fazla 12 kisi. Son katilim seansa 12 saat kalana kadar.
--   - Yer, ancak onceden odeme yapilinca ayrilir; uzman onayi gerekmez.
--   - 12 saat kala 3 kisi yoksa seans iptal olur, odemeler iade sayilir, saat acilir.
--   - Grup seansi uzmanin takviminde saat tutar: session_offers icinde bir satir acar,
--     boylece bireysel seanslarla ayni cakisma kisitina (seans_cakisamaz) uyar.
--   - Danisanlar birbirini goremez. Grup ici mesajlasma yoktur.
--
-- 0017 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid references public.expert_profiles (id) on delete set null,
  topic text not null check (topic in ('kaygi', 'iliski', 'aile', 'kariyer', 'ozguven', 'yas', 'genel')),
  purpose text not null check (char_length(purpose) between 10 and 500),
  purpose_needs_review boolean not null default true,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_kurus int not null check (price_kurus between 100 and 1000000),
  status text not null default 'open' check (status in ('open', 'cancelled')),
  meeting_url text check (meeting_url like 'https://%' and char_length(meeting_url) <= 300),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.group_participants (
  id uuid primary key default gen_random_uuid(),
  group_session_id uuid not null references public.group_sessions (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'paid' check (status in ('paid', 'cancelled')),
  cancelled_by text check (cancelled_by in ('client', 'system')),
  cancelled_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (group_session_id, client_id)
);

-- Takvim: grup seansi saat tutan bir session_offers satiri acar
alter table public.session_offers
  add column if not exists group_session_id uuid references public.group_sessions (id) on delete cascade,
  alter column conversation_id drop not null,
  alter column client_id drop not null;

alter table public.session_offers drop constraint if exists seans_turu_tutarli;
alter table public.session_offers
  add constraint seans_turu_tutarli check (
    (group_session_id is null and conversation_id is not null and client_id is not null)
    or (group_session_id is not null and conversation_id is null and client_id is null)
  );

-- Grup bildirimi sohbete degil, katilimciya baglidir (grup seansinda sohbet yoktur)
alter table public.conversation_flags
  alter column conversation_id drop not null,
  add column if not exists group_participant_id uuid references public.group_participants (id) on delete cascade;

create unique index if not exists conversation_flags_tek_grup
  on public.conversation_flags (group_participant_id)
  where status = 'open' and category = 'seans_yapilmadi';

-- Gruba katilan danisan icin ayri acik riza (grubun konusu saglik bilgisi verebilir)
alter table public.consents drop constraint if exists consents_document_check;
alter table public.consents
  add constraint consents_document_check
  check (document in ('kvkk_aydinlatma', 'acik_riza_mesajlasma', 'acik_riza_grup'));

-- ---------- Herkese acik vitrin: baglanti ve katilimci adi icermez ----------
create or replace view public.grup_vitrini
with (security_barrier = true)
as
  select g.id, g.expert_id, e.display_name, g.topic, g.purpose, g.starts_at, g.ends_at, g.price_kurus,
         (select count(*)::int from public.group_participants p
          where p.group_session_id = g.id and p.status = 'paid') as katilimci
  from public.group_sessions g
  join public.expert_profiles e on e.id = g.expert_id
  where g.status = 'open'
    and g.starts_at - interval '12 hours' > now()
    and e.status = 'approved'
    and (e.verified_until is null or e.verified_until >= current_date);

revoke all on public.grup_vitrini from public, anon, authenticated;
grant select on public.grup_vitrini to anon, authenticated;

-- ---------- Erisim: yazma yalnizca sunucudan ----------
revoke all on public.group_sessions, public.group_participants from anon, authenticated;
grant select on public.group_sessions, public.group_participants to authenticated;
alter table public.group_sessions enable row level security;
alter table public.group_participants enable row level security;

create or replace function public.grup_katilimcisi_mi(p_grup uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_participants
    where group_session_id = p_grup and client_id = auth.uid() and status = 'paid'
  );
$$;

drop policy if exists "uzman ve katilimci grubu gorur" on public.group_sessions;
create policy "uzman ve katilimci grubu gorur" on public.group_sessions
  for select to authenticated
  using (expert_id = auth.uid() or public.grup_katilimcisi_mi(id));

-- Danisan yalnizca kendi kaydini gorur. Uzman katilimci adlarini sunucu uzerinden gorur.
drop policy if exists "danisan kendi katilimini gorur" on public.group_participants;
create policy "danisan kendi katilimini gorur" on public.group_participants
  for select to authenticated
  using (client_id = auth.uid());

-- ---------- Grup acma ----------
create or replace function public.grup_ac(
  p_uzman uuid, p_baslangic timestamptz, p_konu text, p_amac text, p_ucret_kurus int
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uzman public.expert_profiles;
  v_yerel timestamp := p_baslangic at time zone 'Europe/Istanbul';
  v_bitis timestamptz;
  v_id uuid;
begin
  select * into v_uzman from public.expert_profiles where id = p_uzman;
  if not found or v_uzman.kind <> 'independent' then
    raise exception 'YETKI_YOK';
  end if;
  if v_uzman.status <> 'approved' or (v_uzman.verified_until is not null and v_uzman.verified_until < current_date) then
    raise exception 'UZMAN_ONAYSIZ';
  end if;
  if v_uzman.session_minutes is null or not v_uzman.offers_online then
    raise exception 'SURE_YOK';
  end if;
  if p_ucret_kurus is null or p_ucret_kurus not between 100 and 1000000 or p_ucret_kurus % 100 <> 0 then
    raise exception 'UCRET_GECERSIZ';
  end if;
  -- Son katilim 12 saat kala bittigi icin daha yakin bir seans acilamaz
  if p_baslangic - interval '12 hours' <= now()
    or p_baslangic > now() + interval '28 days'
    or date_trunc('hour', v_yerel) <> v_yerel
    or extract(hour from v_yerel) not between 8 and 21 then
    raise exception 'SAAT_GECERSIZ';
  end if;
  if (select count(*) from public.group_sessions
      where expert_id = p_uzman and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'HIZ_SINIRI';
  end if;

  perform public.suresi_dolanlari_kapat(p_uzman);
  v_bitis := p_baslangic + v_uzman.session_minutes * interval '1 minute';

  insert into public.group_sessions (expert_id, topic, purpose, starts_at, ends_at, price_kurus)
  values (p_uzman, p_konu, trim(p_amac), p_baslangic, v_bitis, p_ucret_kurus)
  returning id into v_id;

  begin
    insert into public.session_offers (expert_id, starts_at, ends_at, status, group_session_id)
    values (p_uzman, p_baslangic, v_bitis, 'confirmed', v_id);
  exception when exclusion_violation then
    raise exception 'SAAT_DOLU';
  end;

  return v_id;
end;
$$;

-- ---------- Toplu iptal ----------
create or replace function public.grup_iptal_et(p_grup uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.group_sessions
  set status = 'cancelled', cancelled_at = now(), meeting_url = null
  where id = p_grup and status = 'open';
  if not found then
    return; -- zaten iptal
  end if;

  update public.group_participants
  set status = 'cancelled', cancelled_by = 'system', cancelled_at = now()
  where group_session_id = p_grup and status = 'paid';

  update public.session_offers
  set status = 'cancelled', cancelled_at = now(), cancelled_by = 'system'
  where group_session_id = p_grup and status = 'confirmed';
end;
$$;

-- Uzmanin onayi kalkar veya hesabi silinirse saat satiri iptal olur (0016); grup da onunla kapanir
create or replace function public.grup_saati_iptal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.group_session_id is not null and old.status = 'confirmed' and new.status = 'cancelled' then
    perform public.grup_iptal_et(new.group_session_id);
  end if;
  return new;
end;
$$;

drop trigger if exists session_offers_grup_iptal on public.session_offers;
create trigger session_offers_grup_iptal
  after update of status on public.session_offers
  for each row execute function public.grup_saati_iptal();

create or replace function public.grup_iptal(p_grup uuid, p_uzman uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.group_sessions
    where id = p_grup and expert_id = p_uzman and status = 'open' and starts_at > now()
  ) then
    raise exception 'DURUM_GECERSIZ';
  end if;
  perform public.grup_iptal_et(p_grup);
end;
$$;

-- ---------- Katilim ----------
create or replace function public.grup_katil(p_grup uuid, p_danisan uuid, p_odeme_aktif boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grup public.group_sessions;
  v_id uuid;
begin
  -- Kilit: ayni anda gelen 12. ve 13. kisiden yalnizca biri gecer
  select * into v_grup from public.group_sessions where id = p_grup for update;
  if not found or v_grup.status <> 'open' or v_grup.starts_at - interval '12 hours' <= now() then
    raise exception 'KATILIM_KAPALI';
  end if;
  if (select role from public.profiles where id = p_danisan) is distinct from 'client' then
    raise exception 'YETKI_YOK';
  end if;
  if (select count(*) from public.group_participants
      where group_session_id = p_grup and status = 'paid') >= 12 then
    raise exception 'KONTENJAN_DOLU';
  end if;

  begin
    insert into public.group_participants (group_session_id, client_id)
    values (p_grup, p_danisan)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'ZATEN_KAYITLI';
  end;

  -- Yer, odemeyle ayni islemde ayrilir: odeme olmadan kontenjana sayilmaz
  if p_odeme_aktif then
    perform public.demo_grup_odeme_kaydet(v_id, v_grup.price_kurus);
  end if;
  return v_id;
end;
$$;

create or replace function public.grup_ayril(p_grup uuid, p_danisan uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grup public.group_sessions;
begin
  select * into v_grup from public.group_sessions where id = p_grup for update;
  if not found or v_grup.status <> 'open' or v_grup.starts_at <= now() then
    raise exception 'DURUM_GECERSIZ';
  end if;

  update public.group_participants
  set status = 'cancelled', cancelled_by = 'client', cancelled_at = now()
  where group_session_id = p_grup and client_id = p_danisan and status = 'paid';
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;

  -- Son katilimdan sonra 3 kisinin altina dusen seans yapilamaz
  if v_grup.starts_at - interval '12 hours' <= now()
    and (select count(*) from public.group_participants
         where group_session_id = p_grup and status = 'paid') < 3 then
    perform public.grup_iptal_et(p_grup);
  end if;
end;
$$;

-- ---------- Yonetici: amac metni sonradan kontrol edilir ----------
create or replace function public.admin_grup_kontrol_listesi()
returns table (id uuid, display_name text, topic text, purpose text, starts_at timestamptz)
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
    select g.id, e.display_name, g.topic, g.purpose, g.starts_at
    from public.group_sessions g
    left join public.expert_profiles e on e.id = g.expert_id
    where g.purpose_needs_review and g.status = 'open'
    order by g.created_at;
end;
$$;

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_action_check
  check (action in (
    'belge_goruntule', 'uzman_onayla', 'uzman_reddet', 'foto_kaldir', 'mesaj_goruntule',
    'tanitim_uygun', 'tanitim_kaldir', 'seans_iade', 'seans_aktar', 'grup_uygun', 'grup_kaldir'
  ));

create or replace function public.grup_amac_karari(p_grup uuid, p_kaldir boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'admin' then
    raise exception 'YETKI_YOK';
  end if;
  update public.group_sessions set purpose_needs_review = false
  where id = p_grup and purpose_needs_review;
  if not found then
    return;
  end if;
  if p_kaldir then
    perform public.grup_iptal_et(p_grup);
  end if;
  insert into public.admin_audit_log (admin_id, action, target_id)
  values (auth.uid(), case when p_kaldir then 'grup_kaldir' else 'grup_uygun' end, p_grup);
end;
$$;

-- ---------- Bakim ----------
create or replace function public.grup_bakimi()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_grup uuid;
begin
  for v_grup in
    select g.id from public.group_sessions g
    where g.status = 'open'
      and g.starts_at > now()
      and g.starts_at - interval '12 hours' <= now()
      and (select count(*) from public.group_participants p
           where p.group_session_id = g.id and p.status = 'paid') < 3
  loop
    perform public.grup_iptal_et(v_grup);
  end loop;

  -- Saklama: 12 aydan eski gruplar silinir (katilim ve saat kaydi da gider). Acik bildirim varsa silinmez.
  delete from public.group_sessions g
  where g.ends_at < now() - interval '12 months'
    and not exists (
      select 1 from public.conversation_flags f
      join public.group_participants p on p.id = f.group_participant_id
      where p.group_session_id = g.id and f.status = 'open'
    );
end;
$$;

-- ---------- Uzman silinirken baglantilar silinir ----------
create or replace function public.grup_uzman_siliniyor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.group_sessions set meeting_url = null where expert_id = old.id;
  return old;
end;
$$;

drop trigger if exists expert_profiles_grup_siliniyor on public.expert_profiles;
create trigger expert_profiles_grup_siliniyor
  before delete on public.expert_profiles
  for each row execute function public.grup_uzman_siliniyor();

-- =====================================================================
-- Demo odeme parcasi. Odeme kaldirilirsa yalnizca asagisi silinir, grup_katil odeme kapali calisir.
-- =====================================================================
create table if not exists public.demo_group_payments (
  group_participant_id uuid primary key references public.group_participants (id) on delete cascade,
  amount_kurus int not null check (amount_kurus > 0),
  commission_kurus int not null check (commission_kurus >= 0),
  expert_net_kurus int not null check (expert_net_kurus >= 0),
  status text not null check (status in ('held', 'in_review', 'transferred', 'refunded')),
  paid_at timestamptz not null default now(),
  settled_at timestamptz,
  check (commission_kurus + expert_net_kurus = amount_kurus)
);

revoke all on public.demo_group_payments from anon, authenticated;
grant select on public.demo_group_payments to authenticated;
alter table public.demo_group_payments enable row level security;
drop policy if exists "danisan grup odemesini gorur" on public.demo_group_payments;
create policy "danisan grup odemesini gorur" on public.demo_group_payments
  for select to authenticated
  using (exists (
    select 1 from public.group_participants p
    where p.id = group_participant_id and p.client_id = auth.uid()
  ));

create or replace function public.demo_grup_odeme_kaydet(p_katilimci uuid, p_tutar int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_komisyon int := round(p_tutar * 0.05);
begin
  insert into public.demo_group_payments (group_participant_id, amount_kurus, commission_kurus, expert_net_kurus, status)
  values (p_katilimci, p_tutar, v_komisyon, p_tutar - v_komisyon, 'held');
end;
$$;

-- 24 saatten az kala katilimci ayrilirsa iade yok; toplu iptalde herkes iade alir
create or replace function public.demo_grup_odeme_iptal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_baslangic timestamptz;
begin
  if old.status = 'paid' and new.status = 'cancelled' then
    select starts_at into v_baslangic from public.group_sessions where id = new.group_session_id;
    update public.demo_group_payments
    set status = case
          when new.cancelled_by = 'client' and v_baslangic - new.cancelled_at <= interval '24 hours'
            then 'transferred'
          else 'refunded'
        end,
        settled_at = now()
    where group_participant_id = new.id and status = 'held';
  end if;
  return new;
end;
$$;

drop trigger if exists group_participants_demo_odeme on public.group_participants;
create trigger group_participants_demo_odeme
  after update of status on public.group_participants
  for each row execute function public.demo_grup_odeme_iptal();

create or replace function public.demo_grup_odeme_uzman_siliniyor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.demo_group_payments d set status = 'refunded', settled_at = now()
  from public.group_participants p
  join public.group_sessions g on g.id = p.group_session_id
  where p.id = d.group_participant_id and g.expert_id = old.id and d.status = 'held';
  return old;
end;
$$;

drop trigger if exists expert_profiles_demo_grup_odeme on public.expert_profiles;
create trigger expert_profiles_demo_grup_odeme
  before delete on public.expert_profiles
  for each row execute function public.demo_grup_odeme_uzman_siliniyor();

create or replace function public.grup_seans_yapilmadi_bildir(p_grup uuid, p_danisan uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_katilimci uuid;
begin
  select p.id into v_katilimci
  from public.group_participants p
  join public.group_sessions g on g.id = p.group_session_id
  where p.group_session_id = p_grup and p.client_id = p_danisan and p.status = 'paid'
    and g.status = 'open' and g.starts_at <= now() and g.ends_at + interval '48 hours' > now();
  if v_katilimci is null then
    raise exception 'DURUM_GECERSIZ';
  end if;

  update public.demo_group_payments set status = 'in_review'
  where group_participant_id = v_katilimci and status = 'held';
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;

  insert into public.conversation_flags (source, reported_by, category, group_participant_id)
  values ('user_report', p_danisan, 'seans_yapilmadi', v_katilimci);
end;
$$;

create or replace function public.admin_grup_karti(p_isaret uuid)
returns table (starts_at timestamptz, ends_at timestamptz, amount_kurus int, odeme_durumu text, baglanti_var boolean, display_name text)
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
    select g.starts_at, g.ends_at, d.amount_kurus, d.status, g.meeting_url is not null, e.display_name
    from public.conversation_flags f
    join public.group_participants p on p.id = f.group_participant_id
    join public.group_sessions g on g.id = p.group_session_id
    join public.demo_group_payments d on d.group_participant_id = p.id
    left join public.expert_profiles e on e.id = g.expert_id
    where f.id = p_isaret and f.status = 'open' and f.category = 'seans_yapilmadi';
end;
$$;

create or replace function public.grup_karari(p_isaret uuid, p_karar text, p_sebep text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_katilimci uuid;
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
  returning group_participant_id into v_katilimci;
  if v_katilimci is null then
    raise exception 'ISARET_YOK';
  end if;

  update public.demo_group_payments
  set status = case when p_karar = 'iade' then 'refunded' else 'transferred' end, settled_at = now()
  where group_participant_id = v_katilimci and status = 'in_review';

  insert into public.admin_audit_log (admin_id, action, target_id)
  values (auth.uid(), case when p_karar = 'iade' then 'seans_iade' else 'seans_aktar' end, v_katilimci);
end;
$$;

create or replace function public.demo_grup_odeme_bakimi()
returns void
language sql
security definer
set search_path = ''
as $$
  -- Once onayi kalkmis uzmanin bekletmedeki odemeleri iade edilir, sonra 48 saat dolanlar aktarilir
  update public.demo_group_payments d set status = 'refunded', settled_at = now()
  from public.group_participants p
  join public.group_sessions g on g.id = p.group_session_id
  join public.expert_profiles e on e.id = g.expert_id
  where p.id = d.group_participant_id
    and d.status = 'held'
    and (e.status <> 'approved' or e.verified_until < current_date);

  update public.demo_group_payments d set status = 'transferred', settled_at = now()
  from public.group_participants p
  join public.group_sessions g on g.id = p.group_session_id
  where p.id = d.group_participant_id
    and d.status = 'held'
    and p.status = 'paid'
    and g.status = 'open'
    and g.ends_at + interval '48 hours' <= now();
$$;

-- ---------- Izinler ----------
revoke execute on function public.grup_katilimcisi_mi(uuid) from public, anon;
grant execute on function public.grup_katilimcisi_mi(uuid) to authenticated;

revoke execute on function public.grup_ac(uuid, timestamptz, text, text, int) from public, anon, authenticated;
revoke execute on function public.grup_iptal_et(uuid) from public, anon, authenticated;
revoke execute on function public.grup_saati_iptal() from public, anon, authenticated;
revoke execute on function public.grup_iptal(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.grup_katil(uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.grup_ayril(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.grup_bakimi() from public, anon, authenticated;
revoke execute on function public.grup_uzman_siliniyor() from public, anon, authenticated;
revoke execute on function public.demo_grup_odeme_kaydet(uuid, int) from public, anon, authenticated;
revoke execute on function public.demo_grup_odeme_iptal() from public, anon, authenticated;
revoke execute on function public.demo_grup_odeme_uzman_siliniyor() from public, anon, authenticated;
revoke execute on function public.grup_seans_yapilmadi_bildir(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.demo_grup_odeme_bakimi() from public, anon, authenticated;
revoke execute on function public.admin_grup_kontrol_listesi() from public, anon;
revoke execute on function public.grup_amac_karari(uuid, boolean) from public, anon;
revoke execute on function public.admin_grup_karti(uuid) from public, anon;
revoke execute on function public.grup_karari(uuid, text, text) from public, anon;

grant execute on function public.grup_ac(uuid, timestamptz, text, text, int) to service_role;
grant execute on function public.grup_iptal(uuid, uuid) to service_role;
grant execute on function public.grup_katil(uuid, uuid, boolean) to service_role;
grant execute on function public.grup_ayril(uuid, uuid) to service_role;
grant execute on function public.grup_seans_yapilmadi_bildir(uuid, uuid) to service_role;
grant execute on function public.admin_grup_kontrol_listesi() to authenticated;
grant execute on function public.grup_amac_karari(uuid, boolean) to authenticated;
grant execute on function public.admin_grup_karti(uuid) to authenticated;
grant execute on function public.grup_karari(uuid, text, text) to authenticated;

select cron.schedule('grup-bakimi', '*/10 * * * *', $$select public.grup_bakimi();$$);
select cron.schedule('demo-grup-odeme-bakimi', '15 * * * *', $$select public.demo_grup_odeme_bakimi();$$);
