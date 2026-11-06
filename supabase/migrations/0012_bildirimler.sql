-- =====================================================================
-- 0012_bildirimler.sql
-- Site ici bildirim sayaclari: okunmamis mesajlar ve yanitlanan basvurular.
-- Bildirimler yalnizca SAYI gosterir; mesaj icerigi veya konu bilgisi kullanilmaz.
--
-- 0011 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- Dosya tekrar calistirilirsa hata vermez.
-- =====================================================================

-- ---------- Sohbette her tarafin en son okuma zamani ----------
alter table public.conversations
  add column if not exists client_last_read_at timestamptz not null default now(),
  add column if not exists expert_last_read_at timestamptz not null default now();

-- ---------- Danisan yanitlanan basvurusunu gordu mu? ----------
alter table public.applications add column if not exists client_seen_at timestamptz;

-- Eski basvurular icin bildirim cikmasin
update public.applications set client_seen_at = now() where status <> 'pending' and client_seen_at is null;

create or replace function public.set_responded_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.responded_at := now();
    new.client_seen_at := null;
  end if;
  return new;
end;
$$;

-- ---------- Okunmamis mesaj sayilari ----------
-- security invoker: mesajlar tablosunun erisim kurallari aynen gecerlidir.
create or replace function public.okunmamis_mesajlar()
returns table (konusma_id uuid, adet bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, count(m.id)
  from public.conversations c
  join public.messages m on m.conversation_id = c.id
  where m.sender_id is distinct from auth.uid()
    and (
      (c.client_id = auth.uid() and m.created_at > c.client_last_read_at)
      or (c.expert_id = auth.uid() and m.created_at > c.expert_last_read_at)
    )
  group by c.id;
$$;

-- ---------- Okundu olarak isaretleme ----------
-- Kullanicilarin bu sutunlara yazma izni yok: fonksiyon yalnizca cagiranin kendi sutununu degistirir.
create or replace function public.konusma_okundu(p_konusma uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversations
  set client_last_read_at = case when client_id = auth.uid() then now() else client_last_read_at end,
      expert_last_read_at = case when expert_id = auth.uid() then now() else expert_last_read_at end
  where id = p_konusma and (client_id = auth.uid() or expert_id = auth.uid());
$$;

create or replace function public.basvurular_goruldu()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.applications
  set client_seen_at = now()
  where client_id = auth.uid() and status <> 'pending' and client_seen_at is null;
$$;

revoke execute on function public.okunmamis_mesajlar() from public, anon;
revoke execute on function public.konusma_okundu(uuid) from public, anon;
revoke execute on function public.basvurular_goruldu() from public, anon;
grant execute on function public.okunmamis_mesajlar() to authenticated;
grant execute on function public.konusma_okundu(uuid) to authenticated;
grant execute on function public.basvurular_goruldu() to authenticated;
