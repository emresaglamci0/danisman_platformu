-- =====================================================================
-- 0006_admin_iki_adimli_dogrulama.sql
-- Guvenlik denetimi, Bulgu 1: Admin yetkileri iki adimli dogrulamaya (TOTP) baglanir.
--
-- Tum admin kurallari (RLS politikalari, depolama kurallari, inceleme fonksiyonlari)
-- yetkiyi public.my_role() ile kontrol eder. Bu fonksiyon artik, oturum iki adimli
-- dogrulamadan gecmemisse (JWT'de aal = 'aal2' degilse) admin'e 'admin' DEMEZ.
-- Boylece admin sifresi calinsa bile, telefondaki kod olmadan hicbir admin islemi yapilamaz.
--
-- 0005 dosyasindan SONRA calistirin: SQL Editor > New query > yapistir > Run.
-- =====================================================================

create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.role = 'admin' and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then null
    else p.role
  end
  from public.profiles p
  where p.id = auth.uid();
$$;
