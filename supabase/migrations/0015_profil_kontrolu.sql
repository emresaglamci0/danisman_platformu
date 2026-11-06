-- =====================================================================
-- 0015_profil_kontrolu.sql
-- Uzman tanitim yazilari hemen yayinlanir, yonetici SONRADAN kontrol eder.
--
--   - Yazi degisince kontrol listesine duser.
--   - Yonetici "Uygun" der veya yaziyi kaldirir. Iki karar da degistirilemez kayda yazilir.
--   - Yazma izni tum girisli kullanicilara verilir ama satir kurali (RLS) yalnizca iki adimli
--     dogrulamali admin'e izin verir ("admin uzman profilini gunceller", 0002).
--
-- 0014 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

alter table public.expert_profiles
  add column if not exists bio_needs_review boolean not null default false,
  add column if not exists bio_updated_at timestamptz;

grant update (bio, bio_needs_review) on public.expert_profiles to authenticated;

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_action_check
  check (action in (
    'belge_goruntule', 'uzman_onayla', 'uzman_reddet', 'foto_kaldir', 'mesaj_goruntule',
    'tanitim_uygun', 'tanitim_kaldir'
  ));
