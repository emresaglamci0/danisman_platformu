-- 0019 kurallarini uydurma kayitlarla sinar. Hicbir sey kalici olmaz: en sonda ROLLBACK var.
-- Once 0019_yeni_alanlar.sql calistirilmis olmali.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'uzman@example.test',  '{"kvkk_version":"t","role":"expert","full_name":"Test Uzman","title":"psikolog"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ogrenci@example.test','{"kvkk_version":"t","role":"student_expert","full_name":"Test Ogrenci","department":"pdr","final_year":true}'),
  ('00000000-0000-0000-0000-0000000001d1', 'd1@example.test',     '{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}'),
  ('00000000-0000-0000-0000-0000000001d2', 'd2@example.test',     '{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}'),
  ('00000000-0000-0000-0000-0000000001d3', 'd3@example.test',     '{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}'),
  ('00000000-0000-0000-0000-0000000001d4', 'd4@example.test',     '{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}');

update public.expert_profiles set status = 'approved', session_minutes = 60
where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  o constant uuid := '00000000-0000-0000-0000-00000000000b';
  d1 constant uuid := '00000000-0000-0000-0000-0000000001d1';
  d2 constant uuid := '00000000-0000-0000-0000-0000000001d2';
  d3 constant uuid := '00000000-0000-0000-0000-0000000001d3';
  d4 constant uuid := '00000000-0000-0000-0000-0000000001d4';
  v_t timestamptz := ((current_date + 5)::timestamp + time '14:00') at time zone 'Europe/Istanbul';
  v_hata text;
begin
  -- Bagimsiz uzmanin musait saati (basvuru saat kontrolunu gecmek icin)
  insert into public.expert_availability (expert_id, weekday, hour)
  values (a, extract(isodow from v_t at time zone 'Europe/Istanbul')::int, 14);

  -- Yeni alan basvuruda ve grupta kabul edilir
  insert into public.applications (client_id, expert_id, topic, requested_start) values (d1, a, 'travma', v_t);
  assert exists (select 1 from public.applications where client_id = d1 and topic = 'travma'), 'travma basvurusu kabul edilmeli';
  perform public.grup_ac(a, v_t, 'psikotik', 'Psikotik deneyimler uzerine grup', 50000);
  assert exists (select 1 from public.group_sessions where topic = 'psikotik'), 'psikotik grup kabul edilmeli';

  -- Bagimsiz uzmana kapali alan basvurusu yapilabilir
  insert into public.applications (client_id, expert_id, topic, requested_start) values (d2, a, 'bagimlilik', v_t);
  assert exists (select 1 from public.applications where client_id = d2 and topic = 'bagimlilik'), 'bagimsiz uzmana bagimlilik kabul edilmeli';

  -- Listede olmayan alan reddedilir
  v_hata := null;
  begin insert into public.applications (client_id, expert_id, topic, requested_start) values (d3, a, 'uydurma', v_t);
  exception when check_violation then v_hata := 'CHECK'; end;
  assert v_hata = 'CHECK', 'uydurma alan reddedilmeli';

  -- Ogrenci uzmana kapali alan basvurusu reddedilir
  v_hata := null;
  begin insert into public.applications (client_id, expert_id, topic, requested_start) values (d4, o, 'bagimlilik', v_t);
  exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'ALAN_OGRENCIYE_KAPALI', 'ogrenciye bagimlilik basvurusu reddedilmeli';

  -- Ogrenci uzman kapali alani calisma alani yapamaz, digerini yapabilir
  v_hata := null;
  begin update public.expert_profiles set specialties = array['kaygi', 'psikotik'] where id = o;
  exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'ALAN_OGRENCIYE_KAPALI', 'ogrenci psikotik secememeli';
  update public.expert_profiles set specialties = array['yeme'] where id = o;
  assert (select specialties from public.expert_profiles where id = o) = array['yeme'], 'ogrenci yeme secebilmeli';

  -- Bagimsiz uzman kapali alani secebilir
  update public.expert_profiles set specialties = array['psikotik', 'bagimlilik'] where id = a;

  -- Eski veri baska guncellemeyi bloke etmez (alanlar degismiyorsa)
  alter table public.expert_profiles disable trigger expert_profiles_alan_kontrol;
  update public.expert_profiles set specialties = array['psikotik'] where id = o;
  alter table public.expert_profiles enable trigger expert_profiles_alan_kontrol;
  update public.expert_profiles set bio = 'Yeni tanitim yazisi' where id = o;
  assert (select bio from public.expert_profiles where id = o) = 'Yeni tanitim yazisi', 'eski veri baska guncellemeyi bloke etmemeli';
end;
$$;

rollback;
