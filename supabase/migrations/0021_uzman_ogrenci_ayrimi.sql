-- 0021: Uzman unvanlari ikiye iner, ogrenci gruplari PDR 4. sinif ve Klinik Psikoloji yuksek lisans olur.
-- Bu dosyadan ONCE eski Psikoloji lisans hesaplari silinmeli: npm run eski-hesaplari-sil -- --onay
-- (Hesap SQL ile silinmez; depodaki belge ve fotograflar sahipsiz kalirdi.)

do $$
begin
  if exists (select 1 from public.expert_profiles where department = 'psikoloji') then
    raise exception 'ESKI_PSIKOLOJI_HESAPLARI_SILINMEDI';
  end if;
end;
$$;

update public.expert_profiles set title = 'psikolog' where title = 'klinik_psikolog';
update public.expert_profiles set title = 'psikolojik_danisman' where title = 'uzman_psikolojik_danisman';

alter table public.expert_profiles drop constraint expert_profiles_title_check;
alter table public.expert_profiles
  add constraint expert_profiles_title_check check (title in ('psikolog', 'psikolojik_danisman'));

alter table public.expert_profiles drop constraint expert_profiles_department_check;
alter table public.expert_profiles
  add constraint expert_profiles_department_check check (department in ('pdr', 'klinik_psikoloji_yl'));
