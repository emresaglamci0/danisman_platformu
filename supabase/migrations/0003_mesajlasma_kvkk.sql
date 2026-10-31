-- =====================================================================
-- 0003_mesajlasma_kvkk.sql
-- Sifreli mesajlasma, KVKK acik riza kayitlari ve mesaj hiz siniri.
-- 0002 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- =====================================================================

-- ---------- Mesaj sifreleme ana anahtari (Supabase Vault) ----------
-- Anahtar burada, veritabaninin icinde rastgele uretilir; koda veya .env'e hic yazilmaz.
-- Vault, anahtari Supabase'in yonettigi ayri bir anahtarla sifreli saklar.
-- UYARI: Bu sir silinirse mevcut mesajlar bir daha okunamaz.
create extension if not exists supabase_vault with schema vault;

select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'base64'),
  'mesaj_ana_anahtari',
  'Mesajlarin sifrelenmesinde kullanilan ana anahtar. SILMEYIN.'
);

-- Ana anahtari yalnizca sunucunun gizli anahtarli istemcisi (service_role) okuyabilir
create function public.mesaj_ana_anahtari()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'mesaj_ana_anahtari' limit 1;
$$;
revoke execute on function public.mesaj_ana_anahtari() from public, anon, authenticated;
grant execute on function public.mesaj_ana_anahtari() to service_role;

-- ---------- Konusmalar: yalnizca KABUL EDILMIS basvurular icin ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  expert_id uuid not null references public.expert_profiles (id) on delete cascade,
  -- Bu konusmaya ozel anahtar, ana anahtarla sifrelenmis halde
  wrapped_key text not null,
  created_at timestamptz not null default now()
);

-- Konusma yalnizca kabul edilmis bir basvurudan ve dogru taraflarla acilabilir
create function public.konusma_kontrol()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.applications a
    where a.id = new.application_id
      and a.status = 'accepted'
      and a.client_id = new.client_id
      and a.expert_id = new.expert_id
  ) then
    raise exception 'Konusma yalnizca kabul edilmis basvuru icin acilabilir';
  end if;
  return new;
end;
$$;

create trigger conversations_kontrol
  before insert on public.conversations
  for each row execute function public.konusma_kontrol();

-- ---------- Mesajlar (icerik sifreli saklanir) ----------
create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  ciphertext text not null check (char_length(ciphertext) <= 12000),
  created_at timestamptz not null default now()
);
create index messages_konusma_zaman on public.messages (conversation_id, created_at);
create index messages_gonderen_zaman on public.messages (sender_id, created_at);

-- Spam'e karsi hiz siniri: dakikada en fazla 8, gunde en fazla 200 mesaj
create function public.mesaj_hiz_siniri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 8
  or (select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 day') >= 200
  then
    raise exception 'HIZ_SINIRI';
  end if;
  return new;
end;
$$;

create trigger messages_hiz_siniri
  before insert on public.messages
  for each row execute function public.mesaj_hiz_siniri();

-- ---------- KVKK onay kayitlari: belge turu siniri ve kullanicinin kendisi ekleyebilmesi ----------
alter table public.consents
  add constraint consents_document_check
  check (document in ('kvkk_aydinlatma', 'acik_riza_mesajlasma'));
create index consents_kullanici_belge on public.consents (user_id, document);

-- ---------- Admin islem kaydina "mesaj goruntuleme" eklenir ----------
alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_action_check
  check (action in ('belge_goruntule', 'uzman_onayla', 'uzman_reddet', 'foto_kaldir', 'mesaj_goruntule'));

-- =====================================================================
-- Erisim izinleri ve RLS
-- =====================================================================
revoke all on public.conversations, public.messages from anon, authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, ciphertext) on public.messages to authenticated;
grant insert (user_id, document, version) on public.consents to authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Konusmayi yalnizca iki taraf ve admin gorur
create policy "konusmayi taraflar ve admin gorur" on public.conversations
  for select to authenticated
  using (client_id = auth.uid() or expert_id = auth.uid() or public.my_role() = 'admin');

-- Mesajlari yalnizca iki taraf ve admin okur
create policy "mesajlari taraflar ve admin okur" on public.messages
  for select to authenticated
  using (
    public.my_role() = 'admin'
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.client_id = auth.uid() or c.expert_id = auth.uid())
    )
  );

-- Mesaji yalnizca konusmanin taraflari, kendi adina ve acik riza verdiyse yazabilir
create policy "taraf mesaj yazar" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.client_id = auth.uid() or c.expert_id = auth.uid())
    )
    and exists (
      select 1 from public.consents k
      where k.user_id = auth.uid() and k.document = 'acik_riza_mesajlasma'
    )
  );

-- Kullanici yalnizca kendi adina onay kaydi ekleyebilir
create policy "kendi onayini ekler" on public.consents
  for insert to authenticated
  with check (user_id = auth.uid());
