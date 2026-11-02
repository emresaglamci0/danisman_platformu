-- =====================================================================
-- 0007_mesaj_kurallari.sql
-- Guvenlik denetimi, Bulgu 2: Site atlanarak sifresiz veya kurallara aykiri mesaj yazilamaz.
--
-- 1) Kullanicilarin mesaj tablosuna DOGRUDAN yazma izni kaldirilir. Mesajlari yalnizca
--    site sunucusu, icerigi kontrol edip sifreledikten sonra yazar.
-- 2) Veritabani, KIM yazarsa yazsin (sunucu dahil) su kurallari kendisi uygular:
--    - icerik sifreli bicimde olmali (v1.<iv>.<etiket>.<sifreli metin>),
--    - boyut, 2000 karakterlik mesaja karsilik gelen siniri asamaz,
--    - gonderen o sohbetin tarafi olmali ve acik riza vermis olmali,
--    - gonderim zamani veritabani saatidir (geriye/ileriye tarihli mesaj yazilamaz),
--    - yazilan mesaj sonradan DEGISTIRILEMEZ.
--    Hiz siniri (0003) zaten tetikleyici ile calisiyor ve sunucu icin de gecerli.
--
-- Not: Veritabani mesajin ACIK halini hic gormez (sifreleme bunun icin var). Bu yuzden
-- "bos mesaj olmamali, en fazla 2000 karakter" gibi acik metin kurallarini site, sifrelemeden
-- once kontrol eder; veritabani da sifreli boyut uzerinden ust siniri ayrica zorlar.
--
-- 0006 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez (once eskisini kaldirip yeniden olusturur).
-- =====================================================================

-- ---------- 1) Dogrudan yazma izni kaldirilir ----------
drop policy if exists "taraf mesaj yazar" on public.messages;
revoke insert on public.messages from authenticated;

-- ---------- 2) Icerik bicimi ve boyut ----------
-- iv: 12 bayt -> 16 karakter, etiket: 16 bayt -> 22 karakter (base64url).
-- 2000 karakter x en fazla 4 bayt (UTF-8) = 8000 bayt -> en fazla 10667 karakter sifreli govde.
-- Toplam uzunluk: "v1." (3) + iv (16) + "." (1) + etiket (22) + "." (1) + 10667 = 10710.
-- (PostgreSQL duzenli ifadelerinde tekrar sayisi en fazla 255 olabildigi icin
--  uzunluk ayri olarak char_length ile kontrol edilir.)
alter table public.messages drop constraint if exists messages_sifreli_bicim;
alter table public.messages
  add constraint messages_sifreli_bicim
  check (
    ciphertext ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$'
    and char_length(ciphertext) <= 10710
  );

-- ---------- Gonderen, sohbet ve onay kontrolu (her yazista) ----------
create or replace function public.mesaj_kurallari()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.conversations c
    where c.id = new.conversation_id
      and (c.client_id = new.sender_id or c.expert_id = new.sender_id)
  ) then
    raise exception 'GONDEREN_TARAF_DEGIL';
  end if;

  if not exists (
    select 1 from public.consents k
    where k.user_id = new.sender_id and k.document = 'acik_riza_mesajlasma'
  ) then
    raise exception 'ACIK_RIZA_YOK';
  end if;

  -- Gonderim zamanini her zaman veritabani belirler
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists messages_kurallar on public.messages;
create trigger messages_kurallar
  before insert on public.messages
  for each row execute function public.mesaj_kurallari();

-- ---------- Yazilan mesaj degistirilemez ----------
create or replace function public.mesaj_degistirilemez()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'MESAJ_DEGISTIRILEMEZ';
end;
$$;

drop trigger if exists messages_degistirilemez on public.messages;
create trigger messages_degistirilemez
  before update on public.messages
  for each row execute function public.mesaj_degistirilemez();

revoke execute on function public.mesaj_kurallari() from public, anon, authenticated;
revoke execute on function public.mesaj_degistirilemez() from public, anon, authenticated;
