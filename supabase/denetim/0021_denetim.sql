-- 0021 kurallarini uydurma kayitlarla sinar. Hicbir sey kalici olmaz: en sonda ROLLBACK var.
-- Once 0021_uzman_ogrenci_ayrimi.sql calistirilmis olmali.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'uzman@example.test',  '{"kvkk_version":"t","role":"expert","full_name":"Test Uzman","title":"psikolog"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ogrenci@example.test','{"kvkk_version":"t","role":"student_expert","full_name":"Test Ogrenci","department":"pdr","final_year":true}');

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  o constant uuid := '00000000-0000-0000-0000-00000000000b';
  v_hata text;
begin
  -- Kaldirilan unvanlar reddedilir
  v_hata := null;
  begin update public.expert_profiles set title = 'klinik_psikolog' where id = a;
  exception when check_violation then v_hata := 'CHECK'; end;
  assert v_hata = 'CHECK', 'klinik_psikolog reddedilmeli';

  v_hata := null;
  begin update public.expert_profiles set title = 'uzman_psikolojik_danisman' where id = a;
  exception when check_violation then v_hata := 'CHECK'; end;
  assert v_hata = 'CHECK', 'uzman_psikolojik_danisman reddedilmeli';

  -- Psikoloji lisans artik gecerli degil
  v_hata := null;
  begin update public.expert_profiles set department = 'psikoloji' where id = o;
  exception when check_violation then v_hata := 'CHECK'; end;
  assert v_hata = 'CHECK', 'psikoloji reddedilmeli';

  -- Yeni bolum ve kalan unvan kabul edilir
  update public.expert_profiles set department = 'klinik_psikoloji_yl' where id = o;
  assert exists (select 1 from public.expert_profiles where id = o and department = 'klinik_psikoloji_yl'),
    'klinik_psikoloji_yl kabul edilmeli';
  update public.expert_profiles set title = 'psikolojik_danisman' where id = a;
  assert exists (select 1 from public.expert_profiles where id = a and title = 'psikolojik_danisman'),
    'psikolojik_danisman kabul edilmeli';

  raise notice '0021 denetimi tamam';
end;
$$;

rollback;
