-- =====================================================================
-- 0011_ucretsiz_on_gorusme.sql
-- Bagimsiz uzmanlar isterlerse ucretsiz on gorusme yaptiklarini belirtebilir.
--
--   - Tercih varsayilan olarak kapalidir; yalnizca uzman kendisi acar.
--   - Ogrenci uzmanlarin tum gorusmeleri zaten ucretsiz oldugu icin bu tercih onlarda acilamaz.
--   - Uzmanlara expert_profiles uzerinde yazma izni VERILMEZ (kendi onay durumlarini da
--     degistirebilirlerdi). Tercihi sunucu, kullaniciyi kontrol ettikten sonra kaydeder.
--
-- 0010 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

alter table public.expert_profiles
  add column if not exists offers_free_intro boolean not null default false;

alter table public.expert_profiles
  drop constraint if exists on_gorusme_yalnizca_bagimsiz_uzman;
alter table public.expert_profiles
  add constraint on_gorusme_yalnizca_bagimsiz_uzman
  check (kind = 'independent' or offers_free_intro = false);

-- ---------- Herkese acik vitrine tercih eklenir ----------
-- "create or replace view" yeni sutunun en sona eklenmesini ister.
create or replace view public.uzman_vitrini
with (security_barrier = true)
as
  select id, kind, display_name, title, department, specialties, bio, photo_path, offers_free_intro
  from public.expert_profiles
  where status = 'approved'
    and (verified_until is null or verified_until >= current_date);

revoke all on public.uzman_vitrini from public, anon, authenticated;
grant select on public.uzman_vitrini to anon, authenticated;
