-- 0016 kurallarini uydurma kayitlarla sinar. Hicbir sey kalici olmaz: en sonda ROLLBACK var.
-- Hata vermeden biterse kurallar calisiyor demektir.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'uzman@example.test',  '{"kvkk_version":"t","role":"expert","full_name":"Test Uzman","title":"psikolog"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ogrenci@example.test','{"kvkk_version":"t","role":"student_expert","full_name":"Test Ogrenci","department":"pdr","final_year":true}'),
  ('00000000-0000-0000-0000-00000000000c', 'danisan@example.test','{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}'),
  ('00000000-0000-0000-0000-00000000000d', 'danisan2@example.test','{"kvkk_version":"t","role":"client","full_name":"Test Danisan Iki"}');

update public.expert_profiles set status = 'approved', session_minutes = 50
where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

-- Hep ayni saatler: tum gunler 08-21
insert into public.expert_availability (expert_id, weekday, hour)
select e, d, h
from unnest(array['00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b']::uuid[]) e,
     generate_series(1, 7) d, generate_series(8, 21) h;

create temp table zaman on commit drop as
  select ((current_date + 3)::timestamp + time '14:00') at time zone 'Europe/Istanbul' as t;

do $$
declare
  v_t timestamptz := (select t from zaman);
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  o constant uuid := '00000000-0000-0000-0000-00000000000b';
  c constant uuid := '00000000-0000-0000-0000-00000000000c';
  c2 constant uuid := '00000000-0000-0000-0000-00000000000d';
  v_b uuid; v_k uuid; v_k2 uuid; v_ko uuid; v_p uuid; v_hata text;
begin
  -- Musait olmayan saate basvuru
  v_hata := null;
  begin
    insert into public.applications (client_id, expert_id, requested_start) values (c, a, v_t + interval '30 minutes');
  exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SAAT_UYGUN_DEGIL', 'dakikali basvuru reddedilmeli';

  -- Ayni saate iki danisan basvurabilir, saat kapanmaz
  insert into public.applications (client_id, expert_id, requested_start) values (c, a, v_t) returning id into v_b;
  v_k := public.basvuru_kabul(v_b, a, 'anahtar');
  insert into public.applications (client_id, expert_id, requested_start) values (c2, a, v_t) returning id into v_b;
  v_k2 := public.basvuru_kabul(v_b, a, 'anahtar');
  assert exists (select 1 from public.uzman_musait_saatler(a, v_t, v_t)), 'bagimsiz kabul saati kapatmamali';

  -- Plan saati kapatir, ikinci plan ve cakisan plan reddedilir
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  assert not exists (select 1 from public.uzman_musait_saatler(a, v_t, v_t)), 'plan saati kapatmali';
  v_hata := null;
  begin perform public.plan_gonder(v_k2, a, v_t, 120000); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SAAT_DOLU', 'ayni saate ikinci plan reddedilmeli';

  -- Sure dolan plan saati acar, yeni plan gecer
  update public.session_offers set expires_at = now() - interval '1 minute' where id = v_p;
  assert exists (select 1 from public.uzman_musait_saatler(a, v_t, v_t)), 'suresi dolan plan saati acmali';
  v_p := public.plan_gonder(v_k2, a, v_t, 120000);

  -- Geri cekme saati acar, ret saati acar
  perform public.plan_geri_cek(v_p, a);
  assert exists (select 1 from public.uzman_musait_saatler(a, v_t, v_t)), 'geri cekilen plan saati acmali';
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'ret', true);
  assert exists (select 1 from public.uzman_musait_saatler(a, v_t, v_t)), 'reddedilen plan saati acmali';

  -- Odeme kapaliyken onay kesinlestirir, aciksa odeme bekler
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  assert public.plan_yanitla(v_p, c, 'onay', false) = 'confirmed', 'odeme kapali onay kesinlestirmeli';
  perform public.seans_iptal(v_p, c);
  assert (select cancelled_by from public.session_offers where id = v_p) = 'client', 'iptal eden kaydedilmeli';
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  assert public.plan_yanitla(v_p, c, 'onay', true) = 'awaiting_payment', 'odeme acik onay odeme beklemeli';
  update public.session_offers set status = 'confirmed' where id = v_p;

  -- 90 dakikalik uzman: seans 14 ve 15'i kapatir, onceki saat 13 de kendi suresiyle cakisir
  update public.expert_profiles set session_minutes = 90 where id = a;
  perform public.seans_iptal(v_p, a);
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  assert not exists (select 1 from public.uzman_musait_saatler(a, v_t + interval '1 hour', v_t + interval '1 hour')), '90 dk 15:00 kapanmali';
  assert not exists (select 1 from public.uzman_musait_saatler(a, v_t - interval '1 hour', v_t - interval '1 hour')), '13:00 90 dk ile cakisir';
  assert exists (select 1 from public.uzman_musait_saatler(a, v_t + interval '2 hours', v_t + interval '2 hours')), '16:00 acik kalmali';

  -- 14:30 gibi saat basi olmayan plan ve sinir ihlalleri
  v_hata := null;
  begin perform public.plan_gonder(v_k, a, v_t + interval '1 day 30 minutes', 120000); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SAAT_GECERSIZ', 'dakikali plan reddedilmeli';
  v_hata := null;
  begin perform public.plan_gonder(v_k, a, v_t + interval '1 day', 1000100); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'UCRET_GECERSIZ', '10.001 TL reddedilmeli';
  v_hata := null;
  begin perform public.plan_gonder(v_k, a, v_t + interval '1 day', null); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'UCRET_GECERSIZ', 'bagimsiz uzmanda ucret zorunlu';

  -- Baska uzmanin sohbetine plan
  v_hata := null;
  begin perform public.plan_gonder(v_k, o, v_t, null); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'YETKI_YOK', 'yabanci sohbete plan reddedilmeli';

  -- Ogrenci: kabul saati kapatir, ucretli randevu reddedilir
  insert into public.applications (client_id, expert_id, requested_start) values (c, o, v_t) returning id into v_b;
  v_ko := public.basvuru_kabul(v_b, o, 'anahtar');
  assert not exists (select 1 from public.uzman_musait_saatler(o, v_t, v_t)), 'ogrenci kabulu saati kapatmali';
  assert (select count(*) from public.session_offers where conversation_id = v_ko and status = 'confirmed' and price_kurus is null) = 1, 'ogrenci seansi ucretsiz kesinlesmeli';
  v_hata := null;
  begin perform public.plan_gonder(v_ko, o, v_t + interval '1 day', 120000); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'UCRET_GECERSIZ', 'ogrenciye ucret reddedilmeli';

  -- Ogrenci iki kabulde cakisma: ikinci kabul geri alinir
  insert into public.applications (client_id, expert_id, requested_start)
    values (c2, o, v_t + interval '1 day') returning id into v_b;
  perform public.plan_gonder(v_ko, o, v_t + interval '1 day', null);
  v_hata := null;
  begin perform public.basvuru_kabul(v_b, o, 'anahtar'); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SAAT_DOLU', 'dolu saatte ogrenci kabulu reddedilmeli';
  assert (select status from public.applications where id = v_b) = 'pending', 'hata olunca basvuru bekliyor kalmali';
  assert not exists (select 1 from public.conversations where application_id = v_b), 'hata olunca sohbet acilmamali';

  -- Ogrenci belgesi dolunca bakim seanslari kapatir ve takvim bosalir
  update public.expert_profiles set verified_until = current_date - 1 where id = o;
  perform public.seans_bakimi();
  assert not exists (
    select 1 from public.session_offers
    where expert_id = o and status in ('sent', 'awaiting_payment', 'confirmed')
  ), 'belge dolunca seanslar kapanmali';
  assert not exists (select 1 from public.uzman_musait_saatler(o, now(), now() + interval '7 days')), 'vitrin disi uzmanda saat donmemeli';

  -- Onay kalkarsa seanslar kapanir
  update public.expert_profiles set status = 'rejected' where id = a;
  assert (select status from public.session_offers where id = v_p) = 'expired', 'onay kalkinca bekleyen plan kapanmali';

  -- Onayi kalkmis uzman bekleyen basvuruyu kabul edemez
  update public.expert_profiles set status = 'approved' where id = a;
  insert into public.applications (client_id, expert_id, requested_start)
    values (c, a, v_t + interval '5 days') returning id into v_b;
  update public.expert_profiles set status = 'rejected' where id = a;
  v_hata := null;
  begin perform public.basvuru_kabul(v_b, a, 'anahtar'); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'UZMAN_ONAYSIZ', 'onaysiz uzman kabul edememeli';
  update public.expert_profiles set status = 'approved' where id = a;

  -- On gorusme baglantisi bir kez
  update public.conversations set meeting_url = 'https://meet.google.com/abc' where id = v_k;
  v_hata := null;
  begin update public.conversations set meeting_url = 'https://meet.google.com/xyz' where id = v_k; exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'BAGLANTI_DEGISTIRILEMEZ', 'ikinci baglanti reddedilmeli';
  v_hata := null;
  begin update public.conversations set meeting_url = null where id = v_k; exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'BAGLANTI_DEGISTIRILEMEZ', 'baglanti silinememeli';

  -- Uzman silinince sohbet ve baglanti kurali calisir, gelecek seans iptal olur
  v_p := public.plan_gonder(v_k, a, v_t + interval '2 days', 120000);
  perform public.plan_yanitla(v_p, c, 'onay', false);
  delete from public.expert_profiles where id = a;
  assert (select status from public.session_offers where id = v_p) = 'cancelled', 'uzman silinince seans iptal olmali';
  assert (select expert_id from public.conversations where id = v_k) is null, 'sohbet uzmansiz kalmali';

  -- Otomatik isaret, danisanin ayrilan uzman sohbetini silmesini engellemez; sikayet engeller
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c"}', true);
  insert into public.conversation_flags (conversation_id, source, category, detector)
    values (v_k, 'auto_moderation', 'site_disi_odeme', 'denetim');
  insert into public.conversation_flags (conversation_id, source, reported_by, category)
    values (v_k, 'user_report', c, 'taciz');
  v_hata := null;
  begin perform public.ayrilan_uzman_sohbetini_sil(v_k); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'ACIK_ISARET', 'acik sikayet silmeyi engellemeli';
  update public.conversation_flags set status = 'closed' where conversation_id = v_k and source = 'user_report';
  perform public.ayrilan_uzman_sohbetini_sil(v_k);
  assert not exists (select 1 from public.conversations where id = v_k), 'otomatik isaret silmeyi engellememeli';
  perform set_config('request.jwt.claims', '', true);

  -- Danisan silinince sohbet ve seanslar gider
  delete from public.profiles where id = c2;
  assert not exists (select 1 from public.conversations where id = v_k2), 'danisan silinince sohbet gitmeli';
end;
$$;

rollback;
