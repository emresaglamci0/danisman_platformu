-- =====================================================================
-- 0010_islem_kaydi_degistirilemez.sql
-- Guvenlik denetimi, Bulgu 5: Admin islem kaydi (belge goruntuleme, uzman onay/ret,
-- fotograf kaldirma) DEGISTIRILEMEZ ve SILINEMEZ olur.
--
-- Sohbet erisim kaydindaki (0004) korumanin aynisi:
--   - Kayit eklendikten sonra hic kimse (gizli anahtarli sunucu dahil) degistiremez/silemez.
--   - Tablo toptan bosaltilamaz (TRUNCATE).
--   - Admin hesabi silinse bile kayit korunur: hesaba olan bag (foreign key) kaldirilir.
-- Yeni kayit ekleme eskisi gibi calisir (yalnizca iki adimli dogrulamali admin, kendi adina).
--
-- 0009 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- Admin hesabi silinirse kayit silinmesin / silme islemi engellenmesin diye bag kaldirilir
alter table public.admin_audit_log drop constraint if exists admin_audit_log_admin_id_fkey;

create or replace function public.islem_kaydi_degistirilemez()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'KAYIT_DEGISTIRILEMEZ';
end;
$$;

drop trigger if exists admin_audit_log_degistirilemez on public.admin_audit_log;
create trigger admin_audit_log_degistirilemez
  before update or delete on public.admin_audit_log
  for each row execute function public.islem_kaydi_degistirilemez();

drop trigger if exists admin_audit_log_bosaltilamaz on public.admin_audit_log;
create trigger admin_audit_log_bosaltilamaz
  before truncate on public.admin_audit_log
  for each statement execute function public.islem_kaydi_degistirilemez();

revoke execute on function public.islem_kaydi_degistirilemez() from public, anon, authenticated;
