-- =====================================================================
-- 0013_uzman_ayrilinca_sohbet.sql
-- Uzman hesabini silince danisan sohbeti kaybetmez.
--
--   - Sohbet danisanda SALT OKUNUR kalir; uzmanin adi ve kimligi silinir.
--   - Sohbet, uzman ayrildiktan 6 ay sonra otomatik silinir. Danisan daha once kendisi silebilir.
--   - Acik sikayet veya inceleme varsa sohbet silinmez (kanit korunur).
--   - Danisan kendi hesabini silerse sohbet eskisi gibi tamamen silinir.
--
-- 0012 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- ---------- Basvuru bagi kaldirilir ama numara KALIR ----------
-- UYARI: application_id bosaltilmamali. Sohbet anahtari bu numarayla sifrelendigi icin
-- (src/lib/sifreleme.ts) numara kaybolursa eski mesajlar bir daha okunamaz.
alter table public.conversations drop constraint if exists conversations_application_id_fkey;

-- ---------- Uzman silinince sohbet silinmez, uzman alani bosalir ----------
alter table public.conversations
  add column if not exists expert_left_at timestamptz,
  alter column expert_id drop not null,
  drop constraint if exists conversations_expert_id_fkey;
alter table public.conversations
  add constraint conversations_expert_id_fkey
  foreign key (expert_id) references public.expert_profiles (id) on delete set null;

alter table public.messages
  alter column sender_id drop not null,
  drop constraint if exists messages_sender_id_fkey;
alter table public.messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id) references public.profiles (id) on delete set null;

create or replace function public.uzman_ayrildi()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.expert_id is not null and new.expert_id is null then
    new.expert_left_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_uzman_ayrildi on public.conversations;
create trigger conversations_uzman_ayrildi
  before update on public.conversations
  for each row execute function public.uzman_ayrildi();

-- ---------- Mesajlar yine degistirilemez; tek istisna gonderen bilgisinin silinmesi ----------
create or replace function public.mesaj_degistirilemez()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sender_id is null and old.sender_id is not null
    and new.conversation_id = old.conversation_id
    and new.ciphertext = old.ciphertext
    and new.created_at = old.created_at
  then
    return new;
  end if;
  raise exception 'MESAJ_DEGISTIRILEMEZ';
end;
$$;

-- ---------- Uzman ayrilan sohbete mesaj yazilamaz ----------
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

  if exists (
    select 1 from public.conversations c
    where c.id = new.conversation_id and c.expert_id is null
  ) then
    raise exception 'SOHBET_KAPALI';
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

-- ---------- Danisan, uzmani ayrilan sohbeti kendisi silebilir ----------
create or replace function public.ayrilan_uzman_sohbetini_sil(p_konusma uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.conversation_flags
    where conversation_id = p_konusma and status = 'open'
  ) then
    raise exception 'ACIK_ISARET';
  end if;

  delete from public.conversations
  where id = p_konusma and client_id = auth.uid() and expert_id is null;
  if not found then
    raise exception 'SILINEMEDI';
  end if;
end;
$$;

-- ---------- 6 ay dolunca otomatik silme ----------
create or replace function public.ayrilan_uzman_sohbetlerini_temizle()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.conversations c
  where c.expert_id is null
    and c.expert_left_at < now() - interval '6 months'
    and not exists (
      select 1 from public.conversation_flags f
      where f.conversation_id = c.id and f.status = 'open'
    );
$$;

revoke execute on function public.uzman_ayrildi() from public, anon, authenticated;
revoke execute on function public.ayrilan_uzman_sohbetini_sil(uuid) from public, anon;
revoke execute on function public.ayrilan_uzman_sohbetlerini_temizle() from public, anon, authenticated;
grant execute on function public.ayrilan_uzman_sohbetini_sil(uuid) to authenticated;

-- Her gece 03.00'te (UTC) calisir. Ayni adla yeniden kurulursa eskisinin yerine gecer.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'ayrilan-uzman-sohbet-temizligi',
  '0 3 * * *',
  $$select public.ayrilan_uzman_sohbetlerini_temizle();$$
);
