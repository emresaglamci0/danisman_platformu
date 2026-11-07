-- 0018 kurallarini uydurma kayitlarla sinar. Hicbir sey kalici olmaz: en sonda ROLLBACK var.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'uzman@example.test',  '{"kvkk_version":"t","role":"expert","full_name":"Test Uzman","title":"psikolog"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ogrenci@example.test','{"kvkk_version":"t","role":"student_expert","full_name":"Test Ogrenci","department":"pdr","final_year":true}');

insert into auth.users (id, email, raw_user_meta_data)
select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid,
       'd' || i || '@example.test',
       '{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}'::jsonb
from generate_series(1, 14) i;

update public.expert_profiles set status = 'approved', session_minutes = 60
where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  o constant uuid := '00000000-0000-0000-0000-00000000000b';
  v_t timestamptz := ((current_date + 5)::timestamp + time '14:00') at time zone 'Europe/Istanbul';
  v_g uuid; v_g2 uuid; v_hata text; i int;
  d_ uuid[] := array(select ('00000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid from generate_series(1, 14) n);
begin
  -- Ogrenci uzman grup acamaz
  v_hata := null;
  begin perform public.grup_ac(o, v_t, 'kaygi', 'Kaygi ile basa cikma grubu', 50000); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'YETKI_YOK', 'ogrenci grup acamamali';

  -- 12 saatten yakin seans acilamaz
  v_hata := null;
  begin perform public.grup_ac(a, now() + interval '2 hours', 'kaygi', 'Kaygi ile basa cikma grubu', 50000); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SAAT_GECERSIZ', 'yakin seans reddedilmeli';

  v_g := public.grup_ac(a, v_t, 'kaygi', 'Kaygi ile basa cikma grubu', 50000);

  -- Vitrinde baglanti sutunu yoktur
  assert not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'grup_vitrini' and column_name = 'meeting_url'
  ), 'vitrinde baglanti olmamali';
  assert (select katilimci from public.grup_vitrini where id = v_g) = 0, 'vitrinde gorunmeli';

  -- Grup saati bireysel seansa kapalidir
  insert into public.expert_availability (expert_id, weekday, hour)
  values (a, extract(isodow from v_t at time zone 'Europe/Istanbul')::int, 14);
  assert not exists (select 1 from public.uzman_musait_saatler(a, v_t, v_t)), 'grup saati kapali olmali';

  -- Cakisan ikinci grup reddedilir, hicbir kayit kalmaz
  v_hata := null;
  begin perform public.grup_ac(a, v_t, 'aile', 'Aile iliskileri grup calismasi', 50000); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SAAT_DOLU', 'cakisan grup reddedilmeli';
  assert (select count(*) from public.group_sessions) = 1, 'basarisiz grup kalmamali';

  -- 12 kisi katilir, 13. reddedilir; odeme alinir
  for i in 1..12 loop
    perform public.grup_katil(v_g, d_[i], true);
  end loop;
  v_hata := null;
  begin perform public.grup_katil(v_g, d_[13], true); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'KONTENJAN_DOLU', '13. kisi reddedilmeli';
  assert (select count(*) from public.demo_group_payments where status = 'held') = 12, 'her katilimci odemeli';
  assert (select commission_kurus from public.demo_group_payments limit 1) = 2500, 'komisyon yuzde 5';

  -- Ayni kisi iki kez katilamaz
  v_hata := null;
  begin perform public.grup_katil(v_g, d_[1], true); exception when others then v_hata := sqlerrm; end;
  assert v_hata in ('ZATEN_KAYITLI', 'KONTENJAN_DOLU'), 'tekrar katilim reddedilmeli';

  -- Uzman katilamaz
  perform public.grup_ayril(v_g, d_[12]);
  v_hata := null;
  begin perform public.grup_katil(v_g, a, true); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'YETKI_YOK', 'uzman katilamamali';

  -- 24 saatten fazla kala ayrilan iade alir ve yer acilir
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id where p.client_id = d_[12]) = 'refunded', 'erken ayrilan iade almali';
  perform public.grup_katil(v_g, d_[13], true);

  -- Odeme kapaliyken kayit odemesiz acilir
  v_g2 := public.grup_ac(a, v_t + interval '1 day', 'aile', 'Aile iliskileri grup calismasi', 50000);
  perform public.grup_katil(v_g2, d_[1], false);
  assert not exists (
    select 1 from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
    where p.group_session_id = v_g2
  ), 'odeme kapaliyken kayit olmamali';

  -- 12 saat kala 3 kisi yoksa bakim iptal eder, saat acilir
  update public.session_offers set starts_at = now() + interval '11 hours', ends_at = now() + interval '12 hours' where group_session_id = v_g2;
  update public.group_sessions set starts_at = now() + interval '11 hours', ends_at = now() + interval '12 hours' where id = v_g2;
  perform public.grup_bakimi();
  assert (select status from public.group_sessions where id = v_g2) = 'cancelled', 'eksik grup iptal olmali';
  assert (select status from public.session_offers where group_session_id = v_g2) = 'cancelled', 'saat acilmali';

  -- Odemeli eksik grup: bakim iptalde iade eder
  v_g2 := public.grup_ac(a, v_t + interval '1 day', 'aile', 'Aile iliskileri grup calismasi', 50000);
  perform public.grup_katil(v_g2, d_[1], true);
  perform public.grup_katil(v_g2, d_[2], true);
  update public.session_offers set starts_at = now() + interval '11 hours', ends_at = now() + interval '12 hours' where group_session_id = v_g2;
  update public.group_sessions set starts_at = now() + interval '11 hours', ends_at = now() + interval '12 hours' where id = v_g2;
  perform public.grup_bakimi();
  assert (select count(*) from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g2 and d.status = 'refunded') = 2, 'iptal iade etmeli';

  -- Son katilimdan sonra 3 altina dusme: herkes iptal, ayrilan iade alamaz, digerleri alir
  v_g2 := public.grup_ac(a, v_t + interval '2 days', 'yas', 'Yas ve kayip uzerine grup calismasi', 50000);
  perform public.grup_katil(v_g2, d_[1], true);
  perform public.grup_katil(v_g2, d_[2], true);
  perform public.grup_katil(v_g2, d_[3], true);
  update public.session_offers set starts_at = now() + interval '5 hours', ends_at = now() + interval '6 hours' where group_session_id = v_g2;
  update public.group_sessions set starts_at = now() + interval '5 hours', ends_at = now() + interval '6 hours' where id = v_g2;
  perform public.grup_ayril(v_g2, d_[3]);
  assert (select status from public.group_sessions where id = v_g2) = 'cancelled', 'uc altina dusen grup iptal';
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g2 and p.client_id = d_[3]) = 'transferred', 'gec ayrilan iade almamali';
  assert (select count(*) from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g2 and d.status = 'refunded') = 2, 'digerleri iade almali';

  -- Son katilim kapaninca katilim reddedilir
  v_hata := null;
  begin perform public.grup_katil(v_g2, d_[14], true); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'KATILIM_KAPALI', 'iptal grup katilimi reddedilmeli';

  -- "Seans yapilmadi" bildirimi ve 48 saat aktarimi
  update public.session_offers set starts_at = now() - interval '3 hours', ends_at = now() - interval '2 hours' where group_session_id = v_g;
  update public.group_sessions set starts_at = now() - interval '3 hours', ends_at = now() - interval '2 hours' where id = v_g;
  perform public.grup_seans_yapilmadi_bildir(v_g, d_[1]);
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g and p.client_id = d_[1]) = 'in_review', 'inceleme durumu';

  v_hata := null;
  begin perform public.grup_karari(gen_random_uuid(), 'iade', 'yeterince uzun sebep'); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'YETKI_YOK', 'admin disi karar reddedilmeli';

  update public.session_offers set starts_at = now() - interval '60 hours', ends_at = now() - interval '59 hours' where group_session_id = v_g;
  update public.group_sessions set starts_at = now() - interval '60 hours', ends_at = now() - interval '59 hours' where id = v_g;
  perform public.demo_grup_odeme_bakimi();
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g and p.client_id = d_[2]) = 'transferred', '48 saat sonra aktarilmali';
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g and p.client_id = d_[1]) = 'in_review', 'bakim incelemedekine dokunmamali';

  -- Ayrilan danisan artik katilimci sayilmaz (baglantiyi okuyamaz)
  perform set_config('request.jwt.claims', format('{"sub":"%s"}', d_[12]), true);
  assert public.grup_katilimcisi_mi(v_g) = false, 'ayrilan danisan katilimci sayilmamali';
  perform set_config('request.jwt.claims', format('{"sub":"%s"}', d_[2]), true);
  assert public.grup_katilimcisi_mi(v_g) = true, 'odeyen danisan katilimci sayilmali';
  perform set_config('request.jwt.claims', '', true);

  -- Bitmis grup, sonradan hesap silinip sayi dusse de iptal olmaz
  update public.group_sessions set created_at = now() - interval '2 days'; -- hiz sinirina takilmasin
  v_g2 := public.grup_ac(a, v_t + interval '4 days', 'yas', 'Yas ve kayip uzerine grup calismasi', 50000);
  perform public.grup_katil(v_g2, d_[5], true);
  perform public.grup_katil(v_g2, d_[6], true);
  perform public.grup_katil(v_g2, d_[7], true);
  update public.session_offers set starts_at = now() - interval '6 hours', ends_at = now() - interval '5 hours' where group_session_id = v_g2;
  update public.group_sessions set starts_at = now() - interval '6 hours', ends_at = now() - interval '5 hours' where id = v_g2;
  delete from public.profiles where id = d_[7];
  perform public.grup_bakimi();
  assert (select status from public.group_sessions where id = v_g2) = 'open', 'bitmis grup iptal olmamali';

  -- Onayi kaldirilan uzmana bekletmedeki gecmis grup odemesi aktarilmaz, iade edilir
  update public.expert_profiles set status = 'rejected' where id = a;
  perform public.demo_grup_odeme_bakimi();
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g2 and p.client_id = d_[5]) = 'refunded', 'onay kalkinca grup odemesi iade olmali';
  update public.expert_profiles set status = 'approved' where id = a;

  -- Uzman onayi kalkinca gelecek grup iptal olur ve iade edilir
  v_g2 := public.grup_ac(a, v_t + interval '3 days', 'yas', 'Yas ve kayip uzerine grup calismasi', 50000);
  perform public.grup_katil(v_g2, d_[4], true);
  update public.expert_profiles set status = 'rejected' where id = a;
  assert (select status from public.group_sessions where id = v_g2) = 'cancelled', 'onay kalkinca grup iptal';
  assert (select d.status from public.demo_group_payments d join public.group_participants p on p.id = d.group_participant_id
          where p.group_session_id = v_g2) = 'refunded', 'onay kalkinca iade';

  -- Danisan silinince katilim gider
  delete from public.profiles where id = d_[4];
  assert not exists (select 1 from public.group_participants where client_id = d_[4]), 'katilim silinmeli';
end;
$$;

rollback;
