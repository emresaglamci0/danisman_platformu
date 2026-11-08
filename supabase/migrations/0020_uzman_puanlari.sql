-- =====================================================================
-- 0020_uzman_puanlari.sql
-- Bagimsiz uzmanlara yildiz puani (1-5), sart kontrolu ve vitrinde ozet.
--
--   - Puan vermek icin danisan ile bagimsiz, onayli uzman arasinda en az 2
--     "sayilan seans" gerekir (puan_sayilan_seans). Sart veritabaninda aranir.
--   - Bir danisan bir uzmana tek puan verir, sonradan degistirebilir.
--   - Seans "yapilmadi" diye bildirilir ve sayilan seans 2'nin altina duserse puan silinir.
--   - Puan satirlarini hicbir istemci rolu okuyamaz; herkese acik olan yalnizca
--     uzman_vitrini gorunumundeki ortalama ve sayidir.
--   - Danisan hesabini silerse puan anonim kalir; uzman silinirse puanlari da silinir.
--   - Yazma ve okuma yalnizca sunucu uzerinden (gizli anahtarli istemci, service_role).
--
-- 0019 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- ---------- Puanlar ----------
create table if not exists public.expert_ratings (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.expert_profiles (id) on delete cascade,
  client_id uuid references public.profiles (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expert_id, client_id)
);

revoke all on public.expert_ratings from anon, authenticated;
alter table public.expert_ratings enable row level security;
-- Bilerek okuma kurali yok: satirlari yalnizca sunucu (service_role) ve vitrin gorunumu okur.

-- ---------- "Daha sonra" ile kapatilan degerlendirme penceresi ----------
create table if not exists public.rating_prompt_dismissals (
  client_id uuid references public.profiles (id) on delete cascade,
  expert_id uuid references public.expert_profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (client_id, expert_id)
);

revoke all on public.rating_prompt_dismissals from anon, authenticated;
alter table public.rating_prompt_dismissals enable row level security;

-- Sayilan seans sorgulari icin
create index if not exists session_offers_danisan_uzman on public.session_offers (client_id, expert_id);
create index if not exists conversation_flags_seans_yapilmadi
  on public.conversation_flags (session_offer_id) where category = 'seans_yapilmadi';

-- ---------- Sayilan seans ----------
-- Sayilan seans: onayli, bitmis, bire bir, ucretli (ogrenci randevusu degil) ve
-- hakkinda "seans yapilmadi" kaydi (acik veya kapali) olmayan seans.
-- Kural yalnizca burada yazilidir; puan_sayilan_seans ve bekleyen_degerlendirme bunu kullanir.
create or replace function public.sayilan_seanslar(p_danisan uuid)
returns table (expert_id uuid, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.expert_id, o.ends_at
  from public.session_offers o
  where o.client_id = p_danisan
    and o.expert_id is not null
    and o.status = 'confirmed'
    and o.ends_at < now()
    and o.group_session_id is null
    and o.price_kurus is not null
    and not exists (
      select 1 from public.conversation_flags f
      where f.session_offer_id = o.id and f.category = 'seans_yapilmadi'
    );
$$;

create or replace function public.puan_sayilan_seans(p_danisan uuid, p_uzman uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.sayilan_seanslar(p_danisan) s where s.expert_id = p_uzman;
$$;

-- ---------- Puan verme / degistirme ----------
-- Hata mesajlarinda puan degeri yer almaz.
create or replace function public.uzman_puanla(p_danisan uuid, p_uzman uuid, p_puan int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_puan is null or p_puan not between 1 and 5 then
    raise exception 'GECERSIZ_PUAN';
  end if;

  if not exists (
       select 1 from public.expert_profiles e
       where e.id = p_uzman and e.kind = 'independent'
     )
     or not public.uzman_onayli_mi(p_uzman)
     or public.puan_sayilan_seans(p_danisan, p_uzman) < 2 then
    raise exception 'PUAN_SARTI_YOK';
  end if;

  insert into public.expert_ratings (expert_id, client_id, rating)
  values (p_uzman, p_danisan, p_puan)
  on conflict (expert_id, client_id) do update
    set rating = excluded.rating, updated_at = now();
end;
$$;

-- ---------- Profilde: puan verebilir mi, verdiyse kac? (her zaman tek satir) ----------
create or replace function public.danisan_puan_durumu(p_danisan uuid, p_uzman uuid)
returns table (puan_verebilir boolean, puanim smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select e.kind = 'independent' from public.expert_profiles e where e.id = p_uzman), false)
      and public.uzman_onayli_mi(p_uzman)
      and public.puan_sayilan_seans(p_danisan, p_uzman) >= 2,
    (select r.rating from public.expert_ratings r
     where r.expert_id = p_uzman and r.client_id = p_danisan);
$$;

-- ---------- "Son gorusmeni degerlendir" penceresi icin uzman (en fazla 1 satir) ----------
create or replace function public.bekleyen_degerlendirme(p_danisan uuid)
returns table (expert_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.display_name
  from public.sayilan_seanslar(p_danisan) s
  join public.expert_profiles e on e.id = s.expert_id
  where e.kind = 'independent'
    and public.uzman_onayli_mi(e.id)
    and not exists (
      select 1 from public.expert_ratings r
      where r.expert_id = e.id and r.client_id = p_danisan
    )
    and not exists (
      select 1 from public.rating_prompt_dismissals d
      where d.expert_id = e.id and d.client_id = p_danisan
    )
  group by e.id, e.display_name
  having count(*) >= 2
  order by max(s.ends_at) desc
  limit 1;
$$;

-- ---------- "Daha sonra": pencere bu uzman icin bir daha cikmaz ----------
create or replace function public.degerlendirme_ertele(p_danisan uuid, p_uzman uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.rating_prompt_dismissals (client_id, expert_id)
  values (p_danisan, p_uzman)
  on conflict do nothing;
$$;

-- ---------- Seans "yapilmadi" bildirilince puani geri al ----------
-- Yonetici sonradan "aktar" dese bile puan geri gelmez; danisan isterse yeniden verir.
create or replace function public.puan_geri_al()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_danisan uuid;
  v_uzman uuid;
begin
  select o.client_id, o.expert_id into v_danisan, v_uzman
  from public.session_offers o
  where o.id = new.session_offer_id;

  if v_danisan is not null and v_uzman is not null
     and public.puan_sayilan_seans(v_danisan, v_uzman) < 2 then
    delete from public.expert_ratings
    where expert_id = v_uzman and client_id = v_danisan;
  end if;
  return null;
end;
$$;

drop trigger if exists conversation_flags_puan_geri_al on public.conversation_flags;
create trigger conversation_flags_puan_geri_al
  after insert on public.conversation_flags
  for each row
  when (new.category = 'seans_yapilmadi' and new.session_offer_id is not null)
  execute function public.puan_geri_al();

-- ---------- Vitrin: 0016 tanimi aynen, sona puan ozeti ----------
create or replace view public.uzman_vitrini
with (security_barrier = true)
as
  select e.id, e.kind, e.display_name, e.title, e.department, e.specialties, e.bio, e.photo_path,
         e.offers_free_intro, e.offers_online, e.offers_in_person, e.city, e.district, e.session_minutes,
         case when e.kind = 'independent' then p.ortalama end as puan_ortalama,
         case when e.kind = 'independent' then p.sayi else 0 end as puan_sayisi
  from public.expert_profiles e
  left join lateral (
    select round(avg(r.rating), 4) as ortalama, count(*)::int as sayi
    from public.expert_ratings r
    where r.expert_id = e.id
  ) p on true
  where e.status = 'approved'
    and (e.verified_until is null or e.verified_until >= current_date);

revoke all on public.uzman_vitrini from public, anon, authenticated;
grant select on public.uzman_vitrini to anon, authenticated;

-- ---------- Izinler ----------
revoke execute on function public.sayilan_seanslar(uuid) from public, anon, authenticated;
revoke execute on function public.puan_sayilan_seans(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.uzman_puanla(uuid, uuid, int) from public, anon, authenticated;
revoke execute on function public.danisan_puan_durumu(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.bekleyen_degerlendirme(uuid) from public, anon, authenticated;
revoke execute on function public.degerlendirme_ertele(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.puan_geri_al() from public, anon, authenticated;

grant execute on function public.sayilan_seanslar(uuid) to service_role;
grant execute on function public.puan_sayilan_seans(uuid, uuid) to service_role;
grant execute on function public.uzman_puanla(uuid, uuid, int) to service_role;
grant execute on function public.danisan_puan_durumu(uuid, uuid) to service_role;
grant execute on function public.bekleyen_degerlendirme(uuid) to service_role;
grant execute on function public.degerlendirme_ertele(uuid, uuid) to service_role;
