-- =====================================================================
-- 0016_seans_takvimi.sql
-- Gorusme bilgileri, haftalik takvim, saatli basvuru, plan ve seans randevusu.
--
--   - Danisan uzmanin musait saatini gorur; kim, ne zaman gorusuyor bilgisini goremez.
--   - Basvuru saati kapatmaz. Saati plan kapatir (ogrenci uzmanda basvuru kabulu de kapatir).
--   - Ayni uzmanin cakisan iki seansi veritabani kisitiyla engellenir, ayni anda
--     gonderilen iki plandan yalnizca biri gecer.
--   - Yazma islemlerini yalnizca sunucu yapar (gizli anahtarli istemci).
--   - Ogrenci uzman kaydinda ucret bos olmak zorundadir.
--
-- 0015 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- Cakisma kisiti icin gerekli
create extension if not exists btree_gist with schema extensions;

-- ---------- Uzman gorusme bilgileri ----------
alter table public.expert_profiles
  add column if not exists offers_online boolean not null default true,
  add column if not exists offers_in_person boolean not null default false,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists session_minutes int;

alter table public.expert_profiles drop constraint if exists gorusme_sekli_secili;
alter table public.expert_profiles
  add constraint gorusme_sekli_secili check (offers_online or offers_in_person);

alter table public.expert_profiles drop constraint if exists yuz_yuze_konum;
alter table public.expert_profiles
  add constraint yuz_yuze_konum check (
    not offers_in_person
    or (char_length(city) between 2 and 40 and char_length(district) between 1 and 40)
  );

alter table public.expert_profiles drop constraint if exists seans_suresi_listede;
alter table public.expert_profiles
  add constraint seans_suresi_listede check (session_minutes in (30, 45, 50, 60, 90, 120));

create or replace view public.uzman_vitrini
with (security_barrier = true)
as
  select id, kind, display_name, title, department, specialties, bio, photo_path, offers_free_intro,
         offers_online, offers_in_person, city, district, session_minutes
  from public.expert_profiles
  where status = 'approved'
    and (verified_until is null or verified_until >= current_date);

revoke all on public.uzman_vitrini from public, anon, authenticated;
grant select on public.uzman_vitrini to anon, authenticated;

-- ---------- Haftalik duzen ----------
create table if not exists public.expert_availability (
  expert_id uuid not null references public.expert_profiles (id) on delete cascade,
  weekday int not null check (weekday between 1 and 7), -- 1 pazartesi, 7 pazar
  hour int not null check (hour between 8 and 21),
  primary key (expert_id, weekday, hour)
);

revoke all on public.expert_availability from anon, authenticated;
grant select on public.expert_availability to authenticated;
alter table public.expert_availability enable row level security;
drop policy if exists "uzman kendi duzenini gorur" on public.expert_availability;
create policy "uzman kendi duzenini gorur" on public.expert_availability
  for select to authenticated
  using (expert_id = auth.uid());

-- ---------- Seans kayitlari: plan (ucretli) ve seans randevusu (ucretsiz) ----------
create table if not exists public.session_offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  expert_id uuid references public.expert_profiles (id) on delete set null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_kurus int check (price_kurus between 100 and 1000000), -- ogrenci uzmanda bos
  status text not null check (status in (
    'sent', 'awaiting_payment', 'confirmed', 'rejected', 'withdrawn', 'expired', 'cancelled'
  )),
  expires_at timestamptz,
  meeting_url text check (meeting_url like 'https://%' and char_length(meeting_url) <= 300),
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by in ('client', 'expert', 'system')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Asil koruma: ayni uzmanin saat tutan iki kaydi cakisamaz
  constraint seans_cakisamaz exclude using gist (
    expert_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('sent', 'awaiting_payment', 'confirmed'))
);
create index if not exists session_offers_konusma on public.session_offers (conversation_id, starts_at);

revoke all on public.session_offers from anon, authenticated;
grant select on public.session_offers to authenticated;
alter table public.session_offers enable row level security;
-- Bilerek admin icin kural yok: admin yalnizca sinirli admin_seans_karti fonksiyonunu kullanir (0017).
drop policy if exists "taraflar seansi gorur" on public.session_offers;
create policy "taraflar seansi gorur" on public.session_offers
  for select to authenticated
  using (client_id = auth.uid() or expert_id = auth.uid());

-- ---------- Sikayet kayitlari: yeni sebepler ve seansa bag ----------
alter table public.conversation_flags
  add column if not exists session_offer_id uuid references public.session_offers (id) on delete set null;

alter table public.conversation_flags drop constraint if exists conversation_flags_category_check;
alter table public.conversation_flags
  add constraint conversation_flags_category_check check (category in (
    'taciz', 'uygunsuz_icerik', 'spam', 'guvenlik_riski', 'diger', 'admin_inceleme', 'otomatik',
    'site_disi_odeme', 'seans_yapilmadi'
  ));

drop policy if exists "taraf sohbeti sikayet eder" on public.conversation_flags;
create policy "taraf sohbeti sikayet eder" on public.conversation_flags
  for insert to authenticated
  with check (
    source = 'user_report'
    and reported_by = auth.uid()
    and category in ('taciz', 'uygunsuz_icerik', 'spam', 'guvenlik_riski', 'diger', 'site_disi_odeme')
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.client_id = auth.uid() or c.expert_id = auth.uid())
    )
  );

-- Otomatik kontrol her mesajda yeni kayit acmasin: sohbet basina tek acik otomatik isaret
create unique index if not exists conversation_flags_tek_otomatik
  on public.conversation_flags (conversation_id)
  where status = 'open' and source = 'auto_moderation';

-- ---------- Basvuru: tam tarih ve saat ----------
alter table public.applications
  add column if not exists requested_start timestamptz,
  alter column availability drop not null;

-- ---------- Musait saatler (herkese acik) ----------
-- Yalnizca musait baslangic saatlerini dondurur. Kim, hangi seans, hangi durum bilgisi asla donmez.
create or replace function public.uzman_musait_saatler(p_uzman uuid, p_bas timestamptz, p_bit timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select s.saat
  from public.expert_profiles u
  cross join lateral generate_series(
    date_trunc('hour', greatest(p_bas, now())),
    least(p_bit, now() + interval '28 days'),
    interval '1 hour'
  ) as s(saat)
  join public.expert_availability a
    on a.expert_id = u.id
   and a.weekday = extract(isodow from s.saat at time zone 'Europe/Istanbul')
   and a.hour = extract(hour from s.saat at time zone 'Europe/Istanbul')
  where u.id = p_uzman
    and u.status = 'approved'
    and (u.verified_until is null or u.verified_until >= current_date)
    and u.offers_online
    and u.session_minutes is not null
    and s.saat > now()
    and not exists (
      select 1 from public.session_offers o
      where o.expert_id = u.id
        and (o.status = 'confirmed' or (o.status in ('sent', 'awaiting_payment') and o.expires_at > now()))
        and tstzrange(o.starts_at, o.ends_at) && tstzrange(s.saat, s.saat + u.session_minutes * interval '1 minute')
    );
$$;

-- Yeni basvuru mutlaka musait bir saate yapilir
create or replace function public.basvuru_saati_kontrol()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.requested_start is null or not exists (
    select 1 from public.uzman_musait_saatler(new.expert_id, new.requested_start, new.requested_start) s
    where s = new.requested_start
  ) then
    raise exception 'SAAT_UYGUN_DEGIL';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_saat_kontrol on public.applications;
create trigger applications_saat_kontrol
  before insert on public.applications
  for each row execute function public.basvuru_saati_kontrol();

-- ---------- Sure bitimi ----------
create or replace function public.suresi_dolanlari_kapat(p_uzman uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.session_offers
  set status = 'expired'
  where status in ('sent', 'awaiting_payment')
    and expires_at <= now()
    and (p_uzman is null or expert_id = p_uzman);
$$;

-- ---------- Basvuru kabulu: basvuru, sohbet ve (ogrencide) seans tek islemde ----------
create or replace function public.basvuru_kabul(p_basvuru uuid, p_uzman uuid, p_sarili_anahtar text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_basvuru public.applications;
  v_uzman public.expert_profiles;
  v_konusma uuid;
begin
  update public.applications set status = 'accepted'
  where id = p_basvuru and expert_id = p_uzman and status = 'pending'
  returning * into v_basvuru;
  if not found then
    raise exception 'BASVURU_YOK';
  end if;

  select * into v_uzman from public.expert_profiles where id = p_uzman;

  insert into public.conversations (application_id, client_id, expert_id, wrapped_key)
  values (v_basvuru.id, v_basvuru.client_id, p_uzman, p_sarili_anahtar)
  returning id into v_konusma;

  -- Eski basvurularda tam saat yoktur; onlarda yalnizca sohbet acilir
  if v_uzman.kind = 'student' and v_basvuru.requested_start is not null then
    perform public.suresi_dolanlari_kapat(p_uzman);
    if v_basvuru.requested_start <= now() or v_uzman.session_minutes is null then
      raise exception 'SAAT_DOLU';
    end if;
    begin
      insert into public.session_offers (conversation_id, expert_id, client_id, starts_at, ends_at, status)
      values (
        v_konusma, p_uzman, v_basvuru.client_id, v_basvuru.requested_start,
        v_basvuru.requested_start + v_uzman.session_minutes * interval '1 minute', 'confirmed'
      );
    exception when exclusion_violation then
      raise exception 'SAAT_DOLU';
    end;
  end if;

  return v_konusma;
end;
$$;

-- ---------- Plan gonderme ----------
create or replace function public.plan_gonder(
  p_konusma uuid, p_uzman uuid, p_baslangic timestamptz, p_ucret_kurus int
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_konusma public.conversations;
  v_uzman public.expert_profiles;
  v_yerel timestamp := p_baslangic at time zone 'Europe/Istanbul';
  v_id uuid;
begin
  select * into v_konusma from public.conversations where id = p_konusma and expert_id = p_uzman;
  if not found then
    raise exception 'YETKI_YOK';
  end if;

  select * into v_uzman from public.expert_profiles where id = p_uzman;
  if v_uzman.status <> 'approved' or (v_uzman.verified_until is not null and v_uzman.verified_until < current_date) then
    raise exception 'UZMAN_ONAYSIZ';
  end if;
  if v_uzman.session_minutes is null or not v_uzman.offers_online then
    raise exception 'SURE_YOK';
  end if;

  if v_uzman.kind = 'student' and p_ucret_kurus is not null then
    raise exception 'UCRET_GECERSIZ';
  end if;
  if v_uzman.kind = 'independent'
    and (p_ucret_kurus is null or p_ucret_kurus not between 100 and 1000000 or p_ucret_kurus % 100 <> 0) then
    raise exception 'UCRET_GECERSIZ';
  end if;

  if p_baslangic <= now()
    or p_baslangic > now() + interval '28 days'
    or date_trunc('hour', v_yerel) <> v_yerel
    or extract(hour from v_yerel) not between 8 and 21 then
    raise exception 'SAAT_GECERSIZ';
  end if;

  if (select count(*) from public.session_offers
      where expert_id = p_uzman and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'HIZ_SINIRI';
  end if;

  perform public.suresi_dolanlari_kapat(p_uzman);

  begin
    insert into public.session_offers (
      conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status, expires_at
    )
    values (
      p_konusma, p_uzman, v_konusma.client_id, p_baslangic,
      p_baslangic + v_uzman.session_minutes * interval '1 minute',
      p_ucret_kurus, 'sent', least(now() + interval '24 hours', p_baslangic)
    )
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'SAAT_DOLU';
  end;

  return v_id;
end;
$$;

-- ---------- Danisan yaniti ----------
create or replace function public.plan_yanitla(p_plan uuid, p_danisan uuid, p_karar text, p_odeme_aktif boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.session_offers;
  v_uzman public.expert_profiles;
  v_durum text;
begin
  select * into v_plan from public.session_offers where id = p_plan and client_id = p_danisan for update;
  if not found then
    raise exception 'YETKI_YOK';
  end if;
  if v_plan.expires_at <= now() then
    raise exception 'SURE_DOLDU';
  end if;

  if p_karar = 'ret' then
    if v_plan.status not in ('sent', 'awaiting_payment') then
      raise exception 'DURUM_GECERSIZ';
    end if;
    v_durum := 'rejected';
  elsif p_karar = 'onay' then
    if v_plan.status <> 'sent' then
      raise exception 'DURUM_GECERSIZ';
    end if;
    select * into v_uzman from public.expert_profiles where id = v_plan.expert_id;
    if not found or v_uzman.status <> 'approved'
      or (v_uzman.verified_until is not null and v_uzman.verified_until < current_date) then
      raise exception 'UZMAN_ONAYSIZ';
    end if;
    v_durum := case when v_plan.price_kurus is null or not p_odeme_aktif then 'confirmed' else 'awaiting_payment' end;
  else
    raise exception 'DURUM_GECERSIZ';
  end if;

  update public.session_offers set status = v_durum where id = p_plan;
  return v_durum;
end;
$$;

-- ---------- Uzman yolladigi plani geri ceker ----------
create or replace function public.plan_geri_cek(p_plan uuid, p_uzman uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.session_offers set status = 'withdrawn'
  where id = p_plan and expert_id = p_uzman and status = 'sent';
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;
end;
$$;

-- ---------- Kesinlesmis seans iptali ----------
-- Iade sonucu ayri parcadir: odeme modulu cancelled_by ve cancelled_at alanlarini okur (0017).
create or replace function public.seans_iptal(p_plan uuid, p_kullanici uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.session_offers
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = case when client_id = p_kullanici then 'client' else 'expert' end,
      meeting_url = null
  where id = p_plan
    and (client_id = p_kullanici or expert_id = p_kullanici)
    and status = 'confirmed'
    and starts_at > now();
  if not found then
    raise exception 'DURUM_GECERSIZ';
  end if;
end;
$$;

-- ---------- Uzman onayi kalkarsa veya hesabini silerse ----------
create or replace function public.uzman_seanslarini_kapat(p_uzman uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.session_offers set status = 'expired'
  where expert_id = p_uzman and status in ('sent', 'awaiting_payment');

  update public.session_offers
  set status = 'cancelled', cancelled_at = now(), cancelled_by = 'system', meeting_url = null
  where expert_id = p_uzman and status = 'confirmed' and starts_at > now();
end;
$$;

create or replace function public.uzman_onayi_kalkti()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'approved' and new.status <> 'approved' then
    perform public.uzman_seanslarini_kapat(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists expert_profiles_onay_kalkti on public.expert_profiles;
create trigger expert_profiles_onay_kalkti
  after update of status on public.expert_profiles
  for each row execute function public.uzman_onayi_kalkti();

create or replace function public.uzman_siliniyor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.uzman_seanslarini_kapat(old.id);
  update public.session_offers set meeting_url = null where expert_id = old.id;
  return old;
end;
$$;

drop trigger if exists expert_profiles_siliniyor on public.expert_profiles;
create trigger expert_profiles_siliniyor
  before delete on public.expert_profiles
  for each row execute function public.uzman_siliniyor();

-- ---------- On gorusme baglantisi bir kez yollanir ----------
-- Uzman ayrilinca baglantiyi silen kural (0014) calismaya devam eder.
create or replace function public.gorusme_baglantisi_tek_sefer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.meeting_url is not null
    and new.meeting_url is distinct from old.meeting_url
    and new.expert_id is not null then
    raise exception 'BAGLANTI_DEGISTIRILEMEZ';
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_baglanti_tek_sefer on public.conversations;
create trigger conversations_baglanti_tek_sefer
  before update on public.conversations
  for each row execute function public.gorusme_baglantisi_tek_sefer();

-- ---------- Bakim: saatte bir ----------
create or replace function public.seans_bakimi()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uzman uuid;
begin
  perform public.suresi_dolanlari_kapat(null);

  -- Belge suresi dolan uzmanin seanslari, onayi kalkmis gibi kapatilir
  for v_uzman in
    select distinct e.id
    from public.expert_profiles e
    join public.session_offers o on o.expert_id = e.id
    where e.verified_until < current_date
      and o.status in ('sent', 'awaiting_payment', 'confirmed')
      and (o.status <> 'confirmed' or o.starts_at > now())
  loop
    perform public.uzman_seanslarini_kapat(v_uzman);
  end loop;

  -- Saklama suresi: acik inceleme yoksa 12 aydan eski seans kayitlari silinir
  delete from public.session_offers o
  where o.ends_at < now() - interval '12 months'
    and not exists (
      select 1 from public.conversation_flags f
      where f.session_offer_id = o.id and f.status = 'open'
    );
end;
$$;

-- ---------- Basvurulari artik yalnizca sunucu yanitlar ----------
-- Yoksa uzman dogrudan API ile kabul edip ogrenci seansini ve sohbeti atlayabilirdi.
revoke update (status) on public.applications from authenticated;
drop policy if exists "uzman basvuruyu yanitlar" on public.applications;

-- ---------- Izinler ----------
revoke execute on function public.uzman_musait_saatler(uuid, timestamptz, timestamptz) from public;
grant execute on function public.uzman_musait_saatler(uuid, timestamptz, timestamptz) to anon, authenticated, service_role;

revoke execute on function public.basvuru_saati_kontrol() from public, anon, authenticated;
revoke execute on function public.suresi_dolanlari_kapat(uuid) from public, anon, authenticated;
revoke execute on function public.basvuru_kabul(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.plan_gonder(uuid, uuid, timestamptz, int) from public, anon, authenticated;
revoke execute on function public.plan_yanitla(uuid, uuid, text, boolean) from public, anon, authenticated;
revoke execute on function public.plan_geri_cek(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.seans_iptal(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.uzman_seanslarini_kapat(uuid) from public, anon, authenticated;
revoke execute on function public.uzman_onayi_kalkti() from public, anon, authenticated;
revoke execute on function public.uzman_siliniyor() from public, anon, authenticated;
revoke execute on function public.gorusme_baglantisi_tek_sefer() from public, anon, authenticated;
revoke execute on function public.seans_bakimi() from public, anon, authenticated;

grant execute on function public.basvuru_kabul(uuid, uuid, text) to service_role;
grant execute on function public.plan_gonder(uuid, uuid, timestamptz, int) to service_role;
grant execute on function public.plan_yanitla(uuid, uuid, text, boolean) to service_role;
grant execute on function public.plan_geri_cek(uuid, uuid) to service_role;
grant execute on function public.seans_iptal(uuid, uuid) to service_role;

-- Ayni adla yeniden kurulursa eskisinin yerine gecer.
select cron.schedule('seans-bakimi', '5 * * * *', $$select public.seans_bakimi();$$);
