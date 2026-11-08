-- =====================================================================
-- 0019_yeni_alanlar.sql
-- Calisma alanlari 7'den 19'a cikar (src/lib/sabitler.ts ALANLAR ile ayni liste).
--
--   - applications.topic ve group_sessions.topic kontrolleri 19 degere genisler.
--   - Ogrenci uzmanlar "psikotik" ve "bagimlilik" alanlarinda hizmet vermez:
--       * calisma alanlarina bu ikisini yazamaz (expert_profiles.specialties)
--       * bu iki alanla ogrenci uzmana basvuru yapilamaz (applications.topic)
--     Ihlalde veritabani ALAN_OGRENCIYE_KAPALI hatasi verir.
--   - Uzmanin alanlari degismiyorsa kontrol atlanir; eski veri baska guncellemeyi bloke etmez.
--
-- 0018 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- ---------- Alan listesi kontrolleri ----------
-- Eski kontroller satir ici tanimli oldugu icin Postgres varsayilan adini vermisti.
alter table public.applications drop constraint if exists applications_topic_check;
alter table public.applications
  add constraint applications_topic_check check (topic in (
    'kaygi', 'iliski', 'aile', 'kariyer', 'ozguven', 'yas', 'genel',
    'cift', 'cocuk_ergen', 'ebeveynlik', 'tukenmislik', 'duygudurum', 'travma',
    'yeme', 'bagimlilik', 'uyku', 'cinsel', 'norogelisim', 'psikotik'
  ));

alter table public.group_sessions drop constraint if exists group_sessions_topic_check;
alter table public.group_sessions
  add constraint group_sessions_topic_check check (topic in (
    'kaygi', 'iliski', 'aile', 'kariyer', 'ozguven', 'yas', 'genel',
    'cift', 'cocuk_ergen', 'ebeveynlik', 'tukenmislik', 'duygudurum', 'travma',
    'yeme', 'bagimlilik', 'uyku', 'cinsel', 'norogelisim', 'psikotik'
  ));

-- ---------- Ogrenci uzmanin calisma alanlari ----------
create or replace function public.uzman_alan_kontrol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'student'
     and new.specialties && array['psikotik', 'bagimlilik']
     and (tg_op = 'INSERT' or new.specialties is distinct from old.specialties) then
    raise exception 'ALAN_OGRENCIYE_KAPALI';
  end if;
  return new;
end;
$$;

drop trigger if exists expert_profiles_alan_kontrol on public.expert_profiles;
create trigger expert_profiles_alan_kontrol
  before insert or update of specialties on public.expert_profiles
  for each row execute function public.uzman_alan_kontrol();

-- ---------- Ogrenci uzmana basvuru ----------
-- Adi "applications_alan_kontrol": tetikleyiciler ada gore siralanir, bu ilk calissin (saat kontrolunden once).
create or replace function public.basvuru_alan_kontrol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.topic in ('psikotik', 'bagimlilik')
     and exists (select 1 from public.expert_profiles where id = new.expert_id and kind = 'student') then
    raise exception 'ALAN_OGRENCIYE_KAPALI';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_alan_kontrol on public.applications;
create trigger applications_alan_kontrol
  before insert on public.applications
  for each row execute function public.basvuru_alan_kontrol();

revoke execute on function public.uzman_alan_kontrol() from public, anon, authenticated;
revoke execute on function public.basvuru_alan_kontrol() from public, anon, authenticated;
