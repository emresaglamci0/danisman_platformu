-- =====================================================================
-- 0014_gorusme_baglantisi.sql
-- Uzman, sohbetin icinden kendi goruntulu gorusme baglantisini paylasir.
--
--   - Baglantiyi yalnizca sohbetin taraflari gorur; herkese acik profilde yer almaz.
--   - Kullanicilarin yazma izni yok: sunucu, kisi ve adres kontrolunden sonra kaydeder
--     (izin verilen adresler src/lib/gorusme.ts icinde).
--   - Uzman ayrilinca baglanti silinir.
--
-- 0013 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

alter table public.conversations add column if not exists meeting_url text;

alter table public.conversations drop constraint if exists gorusme_baglantisi_bicimi;
alter table public.conversations
  add constraint gorusme_baglantisi_bicimi
  check (meeting_url like 'https://%' and char_length(meeting_url) <= 300);

create or replace function public.uzman_ayrildi()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.expert_id is not null and new.expert_id is null then
    new.expert_left_at := now();
    new.meeting_url := null;
  end if;
  return new;
end;
$$;
