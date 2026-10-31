-- =====================================================================
-- 0005_inceleme_erisim_duzeltmesi.sql
-- DUZELTME: Admin erisimi, acildigi andaki acik isarete baglanir.
--
-- Sorun (0004): Admin bir sohbeti sebep yazarak acip incelemeyi kapattiktan sonra,
-- 30 dakika icinde sohbet yeniden isaretlenirse YENI SEBEP YAZMADAN mesajlari okuyabiliyordu.
-- Cozum: Erisim kaydi, su an acik olan bir isaret OLUSTURULDUKTAN SONRA yazilmis olmali.
--
-- 0004 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- =====================================================================

create or replace function public.admin_sohbet_okuyabilir(p_konusma uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() = 'admin', false)
    and exists (
      select 1
      from public.conversation_access_log l
      join public.conversation_flags f on f.conversation_id = l.conversation_id
      where l.conversation_id = p_konusma
        and l.admin_id = auth.uid()
        and l.accessed_at > now() - interval '30 minutes'
        and f.status = 'open'
        and f.created_at <= l.accessed_at
    );
$$;
