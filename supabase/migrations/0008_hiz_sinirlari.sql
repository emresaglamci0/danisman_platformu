-- =====================================================================
-- 0008_hiz_sinirlari.sql
-- Guvenlik denetimi, Bulgu 3: Basvuru, sikayet ve dosya yuklemede hiz siniri.
--   - Basvuru : bir danisan 24 saatte en fazla 10 basvuru
--   - Sikayet : bir kullanici 24 saatte en fazla 5 sikayet
--   - Dosya   : bir uzman 1 saatte en fazla 10 yukleme (belge + fotograf toplam)
-- (Mesaj siniri 0003'te: dakikada 8, gunde 200.)
--
-- 0007 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- ---------- Basvuru siniri ----------
create index if not exists applications_danisan_zaman on public.applications (client_id, created_at);

create or replace function public.basvuru_hiz_siniri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.applications
      where client_id = new.client_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'HIZ_SINIRI';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_hiz_siniri on public.applications;
create trigger applications_hiz_siniri
  before insert on public.applications
  for each row execute function public.basvuru_hiz_siniri();

-- ---------- Sikayet siniri (yalnizca kullanici sikayetleri; admin ve bot etkilenmez) ----------
create index if not exists conversation_flags_sikayetci_zaman
  on public.conversation_flags (reported_by, created_at) where source = 'user_report';

create or replace function public.sikayet_hiz_siniri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source = 'user_report' and (
    select count(*) from public.conversation_flags
    where source = 'user_report' and reported_by = new.reported_by
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'HIZ_SINIRI';
  end if;
  return new;
end;
$$;

drop trigger if exists conversation_flags_hiz_siniri on public.conversation_flags;
create trigger conversation_flags_hiz_siniri
  before insert on public.conversation_flags
  for each row execute function public.sikayet_hiz_siniri();

-- ---------- Dosya yukleme siniri ----------
-- Dosyalari yalnizca site sunucusu yukleyebildigi icin (kullanicilarin depoya yazma izni yok),
-- site her yuklemeden ONCE asagidaki fonksiyonla "yukleme hakki" ister.
create table if not exists public.upload_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('belge', 'fotograf')),
  created_at timestamptz not null default now()
);
create index if not exists upload_events_kullanici_zaman on public.upload_events (user_id, created_at);

-- Bu tabloyu kullanicilar hic goremez ve degistiremez
revoke all on public.upload_events from anon, authenticated;
alter table public.upload_events enable row level security;

create or replace function public.yukleme_hakki_kullan(p_kullanici uuid, p_tur text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 1 gunden eski kayitlar gereksiz: temizle (veri minimizasyonu)
  delete from public.upload_events
  where user_id = p_kullanici and created_at < now() - interval '1 day';

  if (select count(*) from public.upload_events
      where user_id = p_kullanici and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'HIZ_SINIRI';
  end if;

  insert into public.upload_events (user_id, kind) values (p_kullanici, p_tur);
end;
$$;

-- Yukleme hakkini yalnizca site sunucusu (gizli anahtar) isteyebilir
revoke execute on function public.yukleme_hakki_kullan(uuid, text) from public, anon, authenticated;
grant execute on function public.yukleme_hakki_kullan(uuid, text) to service_role;

revoke execute on function public.basvuru_hiz_siniri() from public, anon, authenticated;
revoke execute on function public.sikayet_hiz_siniri() from public, anon, authenticated;
