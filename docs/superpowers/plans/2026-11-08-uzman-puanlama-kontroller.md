# Uzman puanlama: veritabanı kontrolleri

`0020_uzman_puanlari.sql` çalıştırıldıktan sonra Supabase SQL Editor'de elle çalıştırılır.

## Elle çalıştırılacak kontroller

Önce 0020'yi SQL Editor'de çalıştırın. Sonra aşağıdaki blokları **ayrı ayrı** çalıştırın. Her blok `begin ... rollback` içinde olduğu için veritabanında iz bırakmaz. Yer tutucuları test verisiyle değiştirin:
- `<danisan_id>`: test danışanının `profiles.id` değeri
- `<uzman_id>`: bağımsız (`kind='independent'`) ve onaylı test uzmanının `id` değeri
- `<konusma_id>`: bu ikisi arasındaki `conversations.id`

Bloklar seansları geçmiş tarihlere ve birbirinden farklı saatlere koyar, böylece `seans_cakisamaz` kısıtına takılmaz. Test uzmanının 2020 yılında seansı yoksa çakışma olmaz.

### Kontrol 1–4: şart, güncelleme, geri alma

```sql
begin;
-- 2 sayilan seans (gecmiste, ucretli, onayli)
insert into public.session_offers (id, conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status)
values
  ('00000000-0000-0000-0000-0000000000a1', '<konusma_id>', '<uzman_id>', '<danisan_id>',
   '2020-01-01 10:00+03', '2020-01-01 11:00+03', 50000, 'confirmed');

-- 1) Tek seans: hata beklenir
do $$ begin
  perform public.uzman_puanla('<danisan_id>', '<uzman_id>', 5);
  raise notice '1) HATALI: hata vermedi';
exception when others then
  raise notice '1) beklenen hata: %', sqlerrm;  -- PUAN_SARTI_YOK
end $$;

insert into public.session_offers (id, conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status)
values
  ('00000000-0000-0000-0000-0000000000a2', '<konusma_id>', '<uzman_id>', '<danisan_id>',
   '2020-01-02 10:00+03', '2020-01-02 11:00+03', 50000, 'confirmed');

-- 2) Iki seans: basarili, sonra 3 ile guncelle
select public.uzman_puanla('<danisan_id>', '<uzman_id>', 5);
select public.uzman_puanla('<danisan_id>', '<uzman_id>', 3);
select count(*) as satir_1_olmali, max(rating) as puan_3_olmali
from public.expert_ratings where expert_id = '<uzman_id>' and client_id = '<danisan_id>';
select * from public.danisan_puan_durumu('<danisan_id>', '<uzman_id>'); -- true, 3

-- 3) Iki seanstan biri bildirilince sayilan seans 1'e duser: puan silinir
insert into public.conversation_flags (conversation_id, source, category, session_offer_id)
values ('<konusma_id>', 'admin_review', 'seans_yapilmadi', '00000000-0000-0000-0000-0000000000a2');
select count(*) as satir_0_olmali from public.expert_ratings
where expert_id = '<uzman_id>' and client_id = '<danisan_id>';

-- 4) Sayilan seans 3 iken biri bildirilirse 2 kalir: puan silinmez
insert into public.session_offers (id, conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status)
values
  ('00000000-0000-0000-0000-0000000000a3', '<konusma_id>', '<uzman_id>', '<danisan_id>',
   '2020-01-03 10:00+03', '2020-01-03 11:00+03', 50000, 'confirmed'),
  ('00000000-0000-0000-0000-0000000000a4', '<konusma_id>', '<uzman_id>', '<danisan_id>',
   '2020-01-04 10:00+03', '2020-01-04 11:00+03', 50000, 'confirmed');
select public.uzman_puanla('<danisan_id>', '<uzman_id>', 4);
insert into public.conversation_flags (conversation_id, source, category, session_offer_id)
values ('<konusma_id>', 'admin_review', 'seans_yapilmadi', '00000000-0000-0000-0000-0000000000a4');
select count(*) as satir_1_olmali from public.expert_ratings
where expert_id = '<uzman_id>' and client_id = '<danisan_id>';
rollback;
```

Not: Bu blok, çiftin başlangıçta sayılan seansı olmadığını varsayar. Önce `select public.puan_sayilan_seans('<danisan_id>', '<uzman_id>');` çalıştırın, sonuç 0 olmalı.

Not: Burada `source='admin_review'` kullanıldı, çünkü `user_report` 24 saatte 5 şikayet sınırına (0008) ve tek açık şikayet kuralına takılabilir. Trigger kaynağa bakmaz. Gerçek akışı da denemek isterseniz yukarıdaki iki bayrak satırının yerine `select public.seans_yapilmadi_bildir('<plan_id>', '<danisan_id>');` çağırın. Bu fonksiyon yalnızca son 48 saatte biten ve bekletmede (`held`) ödemesi olan seansı kabul eder.

### Kontrol 5: öğrenci tipi (ücretsiz) seanslar sayılmaz

```sql
begin;
insert into public.session_offers (conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status)
values
  ('<konusma_id>', '<uzman_id>', '<danisan_id>', '2020-02-01 10:00+03', '2020-02-01 11:00+03', null, 'confirmed'),
  ('<konusma_id>', '<uzman_id>', '<danisan_id>', '2020-02-02 10:00+03', '2020-02-02 11:00+03', null, 'confirmed');
select public.puan_sayilan_seans('<danisan_id>', '<uzman_id>') as onceki_sayi_ile_ayni_olmali;
select * from public.danisan_puan_durumu('<danisan_id>', '<uzman_id>'); -- baska seans yoksa false
rollback;
```

### Kontrol 6: istemci rolü satırları okuyamaz, özeti okur

```sql
begin;
set local role authenticated;
select * from public.expert_ratings;            -- beklenen: permission denied for table expert_ratings
rollback;

begin;
set local role authenticated;
select puan_ortalama, puan_sayisi from public.uzman_vitrini limit 5;  -- calisir
select * from public.rating_prompt_dismissals;  -- beklenen: permission denied
rollback;

begin;
set local role anon;
select public.uzman_puanla('<danisan_id>', '<uzman_id>', 5);  -- beklenen: permission denied for function
rollback;
```

### Kontrol 7: danışan silinince puan kalır, `client_id` boşalır

```sql
begin;
insert into public.session_offers (conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status)
values
  ('<konusma_id>', '<uzman_id>', '<danisan_id>', '2020-03-01 10:00+03', '2020-03-01 11:00+03', 50000, 'confirmed'),
  ('<konusma_id>', '<uzman_id>', '<danisan_id>', '2020-03-02 10:00+03', '2020-03-02 11:00+03', 50000, 'confirmed');
-- Eski puan varsa silinir; yoksa guncelleme eski created_at degerini korur ve sorgu yanlis sonuc verir
delete from public.expert_ratings where expert_id = '<uzman_id>' and client_id = '<danisan_id>';
select public.uzman_puanla('<danisan_id>', '<uzman_id>', 4);
delete from public.profiles where id = '<danisan_id>';
-- Islem icinde now() sabittir; yalnizca bu blokta yazilan puan eslesir
select count(*) as satir_1_olmali, bool_and(client_id is null) as bos_olmali
from public.expert_ratings where expert_id = '<uzman_id>' and created_at = now();
select puan_ortalama, puan_sayisi from public.uzman_vitrini where id = '<uzman_id>';
rollback;
```

`rollback` sayesinde test hesabı geri gelir. Silmeyi kalıcı yapmak istemezseniz bu bloğu değiştirmeden çalıştırın. Profili silmek, sohbetleri ve seansları da siler (on delete cascade). Bu yüzden blok bunları da geri alır.

### Ek kontrol: pencere ve erteleme

```sql
begin;
insert into public.session_offers (conversation_id, expert_id, client_id, starts_at, ends_at, price_kurus, status)
values
  ('<konusma_id>', '<uzman_id>', '<danisan_id>', '2020-04-01 10:00+03', '2020-04-01 11:00+03', 50000, 'confirmed'),
  ('<konusma_id>', '<uzman_id>', '<danisan_id>', '2020-04-02 10:00+03', '2020-04-02 11:00+03', 50000, 'confirmed');
delete from public.expert_ratings where expert_id = '<uzman_id>' and client_id = '<danisan_id>';
delete from public.rating_prompt_dismissals where expert_id = '<uzman_id>' and client_id = '<danisan_id>';
select * from public.bekleyen_degerlendirme('<danisan_id>');  -- uzman gelir (baska uygun uzman daha yakin tarihli degilse)
select public.degerlendirme_ertele('<danisan_id>', '<uzman_id>');
select public.degerlendirme_ertele('<danisan_id>', '<uzman_id>');  -- ikinci kez hata vermez
select * from public.bekleyen_degerlendirme('<danisan_id>');  -- bu uzman artik gelmez
rollback;
```

