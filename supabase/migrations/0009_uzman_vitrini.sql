-- =====================================================================
-- 0009_uzman_vitrini.sql
-- Guvenlik denetimi, Bulgu 7: Ziyaretci ve diger kullanicilar uzman profilinde yalnizca
-- gerekli bilgileri gorur.
--
-- Eskiden onayli uzmanlarin TUM sutunlari herkese acikti (onay tarihi, belge gecerlilik
-- tarihi, ret notu alani, durum...). Artik:
--   - Herkes yalnizca "uzman_vitrini" gorunumunu okur: ad, tur, unvan, bolum,
--     calisma alanlari, tanitim yazisi, fotograf yolu. Yalnizca onayli uzmanlar.
--   - Asil tabloyu (expert_profiles) yalnizca uzmanin kendisi ve admin gorur.
--   - Asil tabloya bakan iki kural (basvuru, fotograf) evet/hayir donen fonksiyonlara cevrilir.
--
-- 0008 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- ---------- Herkese acik vitrin ----------
-- security_barrier: filtre (yalnizca onayli) her zaman once uygulanir, atlatilamaz.
create or replace view public.uzman_vitrini
with (security_barrier = true)
as
  select id, kind, display_name, title, department, specialties, bio, photo_path
  from public.expert_profiles
  where status = 'approved'
    and (verified_until is null or verified_until >= current_date);

-- ONEMLI: Gorunum yalnizca OKUNABILIR olmali. Basit gorunumler varsayilan olarak
-- uzerinden yazmaya izin verdigi icin tum izinler kaldirilip yalnizca okuma verilir.
revoke all on public.uzman_vitrini from public, anon, authenticated;
grant select on public.uzman_vitrini to anon, authenticated;

-- ---------- Asil tablo artik herkese acik degil ----------
drop policy if exists "onayli uzmanlar herkese acik" on public.expert_profiles;
revoke select on public.expert_profiles from anon;
-- (authenticated icin okuma izni kalir; RLS yalnizca "kendi profili" ve "admin" kurallarina izin verir)

-- ---------- Evet/hayir yardimci fonksiyonlari ----------
create or replace function public.uzman_onayli_mi(p_uzman uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.expert_profiles e
    where e.id = p_uzman
      and e.status = 'approved'
      and (e.verified_until is null or e.verified_until >= current_date)
  );
$$;

create or replace function public.onayli_uzman_fotografi_mi(p_yol text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.expert_profiles e
    where e.photo_path = p_yol
      and e.status = 'approved'
      and (e.verified_until is null or e.verified_until >= current_date)
  );
$$;

revoke execute on function public.uzman_onayli_mi(uuid) from public;
revoke execute on function public.onayli_uzman_fotografi_mi(text) from public;
grant execute on function public.uzman_onayli_mi(uuid) to authenticated;
grant execute on function public.onayli_uzman_fotografi_mi(text) to anon, authenticated;

-- ---------- Basvuru kurali: onay kontrolu fonksiyonla ----------
drop policy if exists "danisan basvuru olusturur" on public.applications;
create policy "danisan basvuru olusturur" on public.applications
  for insert to authenticated
  with check (
    client_id = auth.uid()
    and status = 'pending'
    and public.my_role() = 'client'
    and public.uzman_onayli_mi(expert_id)
  );

-- ---------- Fotograf kurali: onay kontrolu fonksiyonla ----------
drop policy if exists "onayli uzman fotografi gorunur" on storage.objects;
create policy "onayli uzman fotografi gorunur" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'profil-fotograflari' and public.onayli_uzman_fotografi_mi(name));
