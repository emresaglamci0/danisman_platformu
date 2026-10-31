-- =====================================================================
-- 0002_belgeler_fotograflar_admin.sql
-- Uzman belgeleri, profil fotograflari, yonetici (admin) yetkileri ve islem kaydi.
-- 0001 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- =====================================================================

-- ---------- Uzman profiline yeni alanlar ----------
alter table public.expert_profiles
  add column photo_path text,
  add column review_note text check (char_length(review_note) <= 500),
  add column reviewed_at timestamptz;

-- ---------- Uzman belgeleri (dosyanin kendisi Storage'da, burada sadece kaydi) ----------
create table public.expert_documents (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles (id) on delete cascade,
  doc_type text not null check (doc_type in ('barkodlu_belge', 'diploma', 'edevlet_ogrenci_belgesi')),
  -- Karar verildikten sonra dosya silinir ve bu alan bosaltilir (veri minimizasyonu)
  storage_path text,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now(),
  -- Her belge turunden uzman basina tek kayit; yeniden yukleme eskisinin yerine gecer
  unique (expert_id, doc_type)
);

-- ---------- Yonetici islem kaydi ----------
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.profiles (id),
  action text not null check (action in ('belge_goruntule', 'uzman_onayla', 'uzman_reddet', 'foto_kaldir')),
  target_id uuid not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Erisim izinleri
-- Dosya yukleme/silme yalnizca sunucu tarafinda, dogrulamadan sonra yapilir.
-- Bu yuzden kullanicilara bu tablolara yazma izni verilmez.
-- =====================================================================
revoke all on public.expert_documents, public.admin_audit_log from anon, authenticated;

grant select on public.expert_documents to authenticated;
grant select, insert on public.admin_audit_log to authenticated;
grant update (status, review_note, reviewed_at, verified_until, photo_path)
  on public.expert_profiles to authenticated;

alter table public.expert_documents enable row level security;
alter table public.admin_audit_log enable row level security;

-- Uzman kendi belge kayitlarini (dosyayi degil) gorur; admin hepsini gorur
create policy "belge kaydini sahibi ve admin gorur" on public.expert_documents
  for select to authenticated
  using (expert_id = auth.uid() or public.my_role() = 'admin');

-- Admin tum uzman profillerini (onaysizlar dahil) gorur
create policy "admin tum uzmanlari gorur" on public.expert_profiles
  for select to authenticated
  using (public.my_role() = 'admin');

-- Uzman profillerini yalnizca admin guncelleyebilir (onay, ret, foto kaldirma)
create policy "admin uzman profilini gunceller" on public.expert_profiles
  for update to authenticated
  using (public.my_role() = 'admin')
  with check (public.my_role() = 'admin');

-- Admin onay/ret icin uzmanin adini gorebilir
create policy "admin profilleri gorur" on public.profiles
  for select to authenticated
  using (public.my_role() = 'admin');

create policy "admin islem kaydi ekler" on public.admin_audit_log
  for insert to authenticated
  with check (admin_id = auth.uid() and public.my_role() = 'admin');

create policy "admin islem kaydini gorur" on public.admin_audit_log
  for select to authenticated
  using (public.my_role() = 'admin');

-- =====================================================================
-- Depolama alanlari (Storage bucket'lari) - ikisi de OZEL (public = false)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uzman-belgeleri', 'uzman-belgeleri', false, 5242880,
    array['application/pdf', 'image/jpeg', 'image/png']),
  -- Fotograflar sunucuda kucultulup WebP'ye cevrildikten sonra kaydedilir
  ('profil-fotograflari', 'profil-fotograflari', false, 2097152,
    array['image/webp']);

-- Belgeler: yalnizca admin okuyabilir (kisa sureli goruntuleme linki uretmek icin gerekli)
create policy "belgeleri yalnizca admin okur" on storage.objects
  for select to authenticated
  using (bucket_id = 'uzman-belgeleri' and public.my_role() = 'admin');

-- Fotograflar: yalnizca ONAYLI uzmanlarin fotografi herkese gosterilebilir
create policy "onayli uzman fotografi gorunur" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and exists (
      select 1 from public.expert_profiles e
      where e.photo_path = storage.objects.name
        and e.status = 'approved'
        and (e.verified_until is null or e.verified_until >= current_date)
    )
  );

-- Uzman kendi fotografini, admin tum fotograflari gorur
create policy "fotografi sahibi ve admin gorur" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.my_role() = 'admin')
  );
