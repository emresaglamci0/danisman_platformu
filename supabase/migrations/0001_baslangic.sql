-- =====================================================================
-- 0001_baslangic.sql
-- Ilk veritabani yapisi: profiller, uzman profilleri, basvurular, KVKK onaylari.
-- Supabase panelinde: SQL Editor > New query > bu dosyanin tamamini yapistir > Run.
-- =====================================================================

-- ---------- Sabit deger listeleri ----------
create type public.user_role as enum ('client', 'expert', 'student_expert', 'admin');
create type public.expert_status as enum ('pending', 'approved', 'rejected', 'expired');
create type public.application_status as enum ('pending', 'accepted', 'rejected');

-- ---------- Profiller (her kullanici icin bir satir) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  created_at timestamptz not null default now()
);

-- ---------- Uzman profilleri (herkese acik bilgiler) ----------
create table public.expert_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('independent', 'student')),
  display_name text not null check (char_length(display_name) between 2 and 80),
  -- Bagimsiz uzmanlar icin unvan, ogrenciler icin bolum
  title text check (title in ('psikolog', 'klinik_psikolog', 'psikolojik_danisman', 'uzman_psikolojik_danisman')),
  department text check (department in ('psikoloji', 'pdr')),
  specialties text[] not null default '{}',
  bio text check (char_length(bio) <= 600),
  status public.expert_status not null default 'pending',
  -- Ogrenci belgesi donemlik oldugu icin onay bu tarihe kadar gecerli
  verified_until date,
  created_at timestamptz not null default now(),
  check (
    (kind = 'independent' and title is not null and department is null)
    or (kind = 'student' and department is not null and title is null)
  )
);

-- ---------- Basvurular (danisan -> uzman) ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  expert_id uuid not null references public.expert_profiles (id) on delete cascade,
  -- Serbest metin yok: sadece listeden secim (hassas veri toplamamak icin)
  topic text check (topic in ('kaygi', 'iliski', 'aile', 'kariyer', 'ozguven', 'yas', 'genel')),
  availability text not null check (availability in ('hafta_ici_gunduz', 'hafta_ici_aksam', 'hafta_sonu')),
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Ayni uzmana ayni anda yalnizca bir bekleyen basvuru
create unique index applications_one_pending
  on public.applications (client_id, expert_id)
  where status = 'pending';

-- ---------- KVKK onay kayitlari ----------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document text not null,
  version text not null,
  accepted_at timestamptz not null default now()
);

-- =====================================================================
-- Yardimci fonksiyonlar
-- =====================================================================

-- Giris yapmis kullanicinin rolunu dondurur
create function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Yeni kayit olunca profil, uzman profili ve KVKK onay kaydini olusturur.
-- Rol kullanicinin sectigi bilgiden okunur ama 'admin' asla secilemez.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  chosen_role public.user_role;
begin
  if meta ->> 'kvkk_version' is null then
    raise exception 'KVKK aydinlatma metni onaylanmadan kayit olunamaz';
  end if;

  chosen_role := case meta ->> 'role'
    when 'expert' then 'expert'::public.user_role
    when 'student_expert' then 'student_expert'::public.user_role
    else 'client'::public.user_role
  end;

  insert into public.profiles (id, role, full_name)
  values (new.id, chosen_role, meta ->> 'full_name');

  if chosen_role = 'expert' then
    insert into public.expert_profiles (id, kind, display_name, title)
    values (new.id, 'independent', meta ->> 'full_name', meta ->> 'title');
  elsif chosen_role = 'student_expert' then
    if coalesce((meta ->> 'final_year')::boolean, false) is not true then
      raise exception 'Ogrenci uzmanlar yalnizca son sinif ogrencisi olabilir';
    end if;
    insert into public.expert_profiles (id, kind, display_name, department)
    values (new.id, 'student', meta ->> 'full_name', meta ->> 'department');
  end if;

  insert into public.consents (user_id, document, version)
  values (new.id, 'kvkk_aydinlatma', meta ->> 'kvkk_version');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Basvuru yanitlaninca yanit zamanini otomatik yazar
create function public.set_responded_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger applications_set_responded_at
  before update on public.applications
  for each row execute function public.set_responded_at();

-- =====================================================================
-- Erisim izinleri
-- Once tum izinler kaldirilir, sonra yalnizca gerekenler verilir.
-- =====================================================================
revoke all on public.profiles, public.expert_profiles, public.applications, public.consents
  from anon, authenticated;
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.my_role() to authenticated;

grant select on public.expert_profiles to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert on public.applications to authenticated;
grant update (status) on public.applications to authenticated;
grant select on public.consents to authenticated;

-- =====================================================================
-- Satir duzeyinde guvenlik (RLS): kim hangi satiri gorebilir/degistirebilir
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.applications enable row level security;
alter table public.consents enable row level security;

-- Profiller: herkes kendi profilini gorur
create policy "kendi profilini gorur" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Uzman, kendisine basvuran danisanin adini gorebilir
create policy "uzman basvuranini gorur" on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.applications a
    where a.client_id = profiles.id and a.expert_id = auth.uid()
  ));

-- Uzman profilleri: onayli ve suresi gecmemis olanlar herkese acik
create policy "onayli uzmanlar herkese acik" on public.expert_profiles
  for select to anon, authenticated
  using (status = 'approved' and (verified_until is null or verified_until >= current_date));

-- Uzman kendi profilini (onaysiz olsa da) gorur
create policy "uzman kendi profilini gorur" on public.expert_profiles
  for select to authenticated
  using (id = auth.uid());

-- Basvurular: yalnizca taraflar gorur
create policy "taraflar basvuruyu gorur" on public.applications
  for select to authenticated
  using (client_id = auth.uid() or expert_id = auth.uid());

-- Yalnizca danisanlar, yalnizca onayli uzmana, kendi adina basvurabilir
create policy "danisan basvuru olusturur" on public.applications
  for insert to authenticated
  with check (
    client_id = auth.uid()
    and status = 'pending'
    and public.my_role() = 'client'
    and exists (
      select 1 from public.expert_profiles e
      where e.id = expert_id
        and e.status = 'approved'
        and (e.verified_until is null or e.verified_until >= current_date)
    )
  );

-- Uzman yalnizca bekleyen basvuruyu kabul/ret edebilir
create policy "uzman basvuruyu yanitlar" on public.applications
  for update to authenticated
  using (expert_id = auth.uid() and status = 'pending')
  with check (expert_id = auth.uid() and status in ('accepted', 'rejected'));

-- KVKK onaylari: herkes kendi kaydini gorur
create policy "kendi onaylarini gorur" on public.consents
  for select to authenticated
  using (user_id = auth.uid());
