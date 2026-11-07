-- 0017 kurallarini uydurma kayitlarla sinar. Hicbir sey kalici olmaz: en sonda ROLLBACK var.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'uzman@example.test',  '{"kvkk_version":"t","role":"expert","full_name":"Test Uzman","title":"psikolog"}'),
  ('00000000-0000-0000-0000-00000000000c', 'danisan@example.test','{"kvkk_version":"t","role":"client","full_name":"Test Danisan"}'),
  ('00000000-0000-0000-0000-00000000000e', 'admin@example.test',  '{"kvkk_version":"t","role":"client","full_name":"Test Yonetici"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000e';

update public.expert_profiles set status = 'approved', session_minutes = 50
where id = '00000000-0000-0000-0000-00000000000a';

insert into public.expert_availability (expert_id, weekday, hour)
select '00000000-0000-0000-0000-00000000000a', d, h from generate_series(1, 7) d, generate_series(8, 21) h;

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  c constant uuid := '00000000-0000-0000-0000-00000000000c';
  v_t timestamptz := ((current_date + 5)::timestamp + time '14:00') at time zone 'Europe/Istanbul';
  v_b uuid; v_k uuid; v_p uuid; v_i uuid; v_hata text;
begin
  insert into public.applications (client_id, expert_id, requested_start) values (c, a, v_t) returning id into v_b;
  v_k := public.basvuru_kabul(v_b, a, 'anahtar');

  -- Odeme: seans kesinlesir, %5 komisyon, bekletmede
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'onay', true);
  perform public.demo_odeme_yap(v_p, c);
  assert (select status from public.session_offers where id = v_p) = 'confirmed', 'odeme seansi kesinlestirmeli';
  assert (select commission_kurus from public.demo_payments where session_offer_id = v_p) = 6000, 'komisyon 60 TL olmali';
  assert (select expert_net_kurus from public.demo_payments where session_offer_id = v_p) = 114000, 'uzmana 1140 TL kalmali';
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'held', 'odeme bekletilmeli';

  -- Ikinci kez odeme yapilamaz
  v_hata := null;
  begin perform public.demo_odeme_yap(v_p, c); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'DURUM_GECERSIZ', 'ikinci odeme reddedilmeli';

  -- 24 saatten fazla kala danisan iptali: iade
  perform public.seans_iptal(v_p, c);
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'refunded', 'erken iptal iade olmali';

  -- 24 saatten az kala danisan iptali: iade yok
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'onay', true);
  perform public.demo_odeme_yap(v_p, c);
  update public.session_offers set starts_at = now() + interval '5 hours', ends_at = now() + interval '6 hours' where id = v_p;
  perform public.seans_iptal(v_p, c);
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'transferred', 'gec danisan iptali iade olmamali';

  -- 24 saatten az kala uzman iptali: iade
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'onay', true);
  perform public.demo_odeme_yap(v_p, c);
  update public.session_offers set starts_at = now() + interval '5 hours', ends_at = now() + interval '6 hours' where id = v_p;
  perform public.seans_iptal(v_p, a);
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'refunded', 'gec uzman iptali iade olmali';

  -- Seans bitti, 48 saat doldu: aktarilir
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'onay', true);
  perform public.demo_odeme_yap(v_p, c);
  update public.session_offers set starts_at = now() - interval '50 hours', ends_at = now() - interval '49 hours' where id = v_p;
  perform public.demo_odeme_bakimi();
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'transferred', '48 saat sonra aktarilmali';

  -- Sure dolduktan sonra "Seans yapilmadi" denemez
  v_hata := null;
  begin perform public.seans_yapilmadi_bildir(v_p, c); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'DURUM_GECERSIZ', 'suresi gecen bildirim reddedilmeli';

  -- Danisanin acik sikayeti varken de bildirebilir
  insert into public.conversation_flags (conversation_id, source, reported_by, category)
    values (v_k, 'user_report', c, 'taciz');
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'onay', true);
  perform public.demo_odeme_yap(v_p, c);
  v_hata := null;
  begin perform public.seans_yapilmadi_bildir(v_p, c); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'DURUM_GECERSIZ', 'seans baslamadan bildirim reddedilmeli';

  update public.session_offers set starts_at = now() - interval '2 hours', ends_at = now() - interval '1 hour' where id = v_p;
  perform public.seans_yapilmadi_bildir(v_p, c);
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'in_review', 'inceleme durumu';
  select id into v_i from public.conversation_flags where session_offer_id = v_p;
  assert v_i is not null, 'isaret acilmali';

  -- Bakim incelemedekine dokunmaz
  update public.session_offers set starts_at = now() - interval '60 hours', ends_at = now() - interval '59 hours' where id = v_p;
  perform public.demo_odeme_bakimi();
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'in_review', 'bakim incelemedekine dokunmamali';

  -- Admin degilse karar veremez
  v_hata := null;
  begin perform public.seans_karari(v_i, 'iade', 'yeterince uzun sebep'); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'YETKI_YOK', 'admin disi karar reddedilmeli';
  v_hata := null;
  begin perform public.admin_seans_karti(v_i); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'YETKI_YOK', 'admin disi kart reddedilmeli';

  -- Iki adimli dogrulamali admin
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000e","aal":"aal2"}', true);

  v_hata := null;
  begin perform public.isaret_kapat(v_i); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'KARAR_GEREKLI', 'genel kapatma reddedilmeli';
  assert (select baglanti_var from public.admin_seans_karti(v_i)) = false, 'kart ozet donmeli';

  v_hata := null;
  begin perform public.seans_karari(v_i, 'iade', 'kisa'); exception when others then v_hata := sqlerrm; end;
  assert v_hata = 'SEBEP_GECERSIZ', 'kisa sebep reddedilmeli';

  perform public.seans_karari(v_i, 'iade', 'Uzman gorusmeye katilmadi');
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'refunded', 'karar iade etmeli';
  assert (select status from public.conversation_flags where id = v_i) = 'closed', 'karar isareti kapatmali';
  assert exists (select 1 from public.admin_audit_log where action = 'seans_iade' and target_id = v_p), 'karar kayda yazilmali';

  -- Uzman silinince bekletmedeki gecmis odeme iade edilir
  v_p := public.plan_gonder(v_k, a, v_t, 120000);
  perform public.plan_yanitla(v_p, c, 'onay', true);
  perform public.demo_odeme_yap(v_p, c);
  update public.session_offers set starts_at = now() - interval '2 hours', ends_at = now() - interval '1 hour' where id = v_p;
  delete from public.expert_profiles where id = a;
  assert (select status from public.demo_payments where session_offer_id = v_p) = 'refunded', 'uzman silinince iade olmali';
end;
$$;

rollback;
