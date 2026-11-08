# Uzman puanlama (yıldız) sistemi — tasarım

Tarih: 2026-11-08 · Durum: taslak, kullanıcı onayı bekliyor

## Amaç ve neden

Danışanlar bağımsız uzmanları 1–5 yıldızla puanlar. Amaç rekabeti artırmak: çok görüşme yapıp danışanını memnun bırakan uzman öne çıkmalı, tek bir iyi puan ise uzun süreli iyi performansın önüne geçmemeli. Puansız (yeni) uzmanlar da şans bulmalı. Bu yüzden onlar her açılışta rastgele sıralanır.

## Hedefler

- Danışan, bir bağımsız uzmanla **en az 2 tamamlanmış görüşmeden** sonra o uzmana 1–5 yıldız verebilir.
- Puan iki yerden verilir:
  1. Uzmanın profil sayfasından (`/uzmanlar/[id]`).
  2. Şartı sağlayan danışan siteye girdiğinde açılan **"Son görüşmeni değerlendir"** penceresinden.
- `/uzmanlar` listesi ve ölçek sonucundaki bağımsız uzmanlar puana göre sıralanır (kural aşağıda).
- Yıldızlar uzman kartında ve uzman profilinde görünür: gerçek ortalama ve değerlendirme sayısıyla, ör. `★ 4,2 (100 değerlendirme)`.
- Yıldızlar sarıdır ve sitenin SVG animasyon tarzında hareket eder (aşağıda).

## Hedef dışı (yapılmayacak)

- **Yazılı yorum yok**, yalnızca yıldız var. Yorum sağlık bilgisi içerebilir ve hassas veri kuralına ters düşer.
- **Öğrenci uzmanlar puanlanmaz**, yıldız göstermez, puan sıralamasına girmez (kullanıcı kararı).
- Yüz yüze görüşmeler sayılmaz, çünkü sitede plan kaydı yoktur.
- Ücretsiz ön görüşme sayılmaz, çünkü yalnızca mesajlaşmadır ve seans kaydı yoktur.
- Grup seansları sayılmaz (`session_offers.group_session_id` dolu olanlar).
- Uzmanın puana yanıt vermesi, puana itiraz etmesi ve puan geçmişi grafiği yok.

## Anti-hedefler (çalışsa bile başarısızlık sayılır)

- Uzmanın, kendisine **kimin** kaç puan verdiğini görebilmesi.
- Tek bir kötü puanın yeni bir uzmanı listenin dibine itmesi.
- Danışanın puan verme şartını boş seanslarla veya "seans yapılmadı" dediği seanslarla sağlayabilmesi.
- Puan sisteminin ölçek modülüne bağımlı olması. Ölçek kapalıyken puanlama eksiksiz çalışmalı.

## Kurallar

### Puan verme şartı

"Tamamlanmış görüşme", şu `session_offers` kaydıdır:
- `status = 'confirmed'` ve `ends_at < now()`
- `group_session_id is null`
- `price_kurus is not null`. Öğrenci uzman randevularında bu alan boştur. Böylece uzmanın türü ileride değişse bile eski ücretsiz staj seansları sayılmaz (benim kararım).
- Bu seans için `category = 'seans_yapilmadi'` olan bir `conversation_flags` kaydı **yok**. Kayıt açık veya kapalı olabilir, iki durumda da seans sayılmaz. Bu benim kararım: incelenen seansı saymamak en basit ve en güvenli yol.

Danışan ile uzman (`client_id`, `expert_id`) arasında bu şartı sağlayan en az 2 seans olmalı. Şart **veritabanında** kontrol edilir (puan yazan fonksiyonda veya trigger'da), yalnızca arayüzde değil.

- Uzman `kind = 'independent'` ve şu an onaylı olmalı.
- Bir danışan bir uzmana **tek puan** verir. Sonradan puanını değiştirebilir (güncelleme). Değiştirdiğinde şart yeniden aranır.
- Seans sonradan "seans yapılmadı" diye bildirilirse ve danışanın o uzmanla sayılan seansı 2'nin altına düşerse, **verdiği puan silinir** (kullanıcı kararı). Bu, `conversation_flags` tablosuna `category = 'seans_yapilmadi'` kaydı eklendiğinde çalışan bir trigger ile yapılır. Yönetici sonradan "aktar" kararı verse bile puan geri gelmez, danışan isterse yeniden verir. Herkese açık özet şartı her okunuşta yeniden hesaplamaz. Silinmiş danışanların puanları kalır; bu danışanlar artık bildirim yapamaz.
- Bilinen açık: ödeme modülü kapalıyken (`ODEME_MODULU_AKTIF=false`) plan ödemesiz `confirmed` olur. Bir uzman, bir tanıdığıyla iki sahte plan yapıp kendine puan verdirebilir. Ödeme demo olduğu için bu açık şimdilik kabul edildi (benim kararım). Puan şartı ödeme modülüne bağlanmaz, çünkü modül kaldırılabilir olmalı. `YAYIN-ONCESI.md` dosyasına "gerçek ödemeyle birlikte puan şartı yeniden değerlendirilmeli" maddesi eklenir.

### Sıralama (ağırlıklı puan / Bayes ortalaması)

```
agirlikli = (C × m + puan_toplami) / (C + puan_sayisi)
C = 5, m = 3,5
```

Örnekler:
- 1 kişiden 5 alan: 3,75
- 100 kişiden ortalama 4,2 alan: 4,17
- Tek kişiden 1 alan: 3,08. Alt bölüme inmez, yalnızca 1 yıldızlarla inmesi için 4 tane gerekir (3 tane: 2,56; 4 tane: 2,39) (kullanıcı kararı).

Liste üç bölümdür:
1. **Üst:** puanı olan ve `agirlikli >= 2,5` olan bağımsız uzmanlar, `agirlikli` değerine göre büyükten küçüğe. Eşitlikte rastgele (benim kararım).
2. **Orta:** puanı olmayan bağımsız uzmanlar ve **tüm öğrenci uzmanlar**, her istekte rastgele (`karistir`).
3. **Alt:** puanı olan ve `agirlikli < 2,5` olan bağımsız uzmanlar, `agirlikli` değerine göre büyükten küçüğe.

`C`, `m` ve `2,5` tek yerde sabit olarak durur (`src/lib/sabitler.ts` veya yeni `src/lib/siralama.ts`).

Bu kural şu yerlerde `karistir` çağrısının yerini alır:
- `src/app/uzmanlar/page.tsx`: filtreler (tür, alan, arama) aynı kalır, sıralama değişir.
- `src/modules/olcek/puanlama.ts` → `uzmanlariSec`: bağımsız bölüm yeni kuralla sıralanır. Psikotik uzmanların öne alınması korunur: psikotik uzmanlar önce gelir ve kendi aralarında puan kuralıyla sıralanır, sonra diğerleri yine puan kuralıyla sıralanır (benim kararım; güvenlik önceliği puandan önce gelir). Ayrıca "eşleşen alan sayısı sıralamayı etkilemez" kuralı da korunur. Öğrenci bölümü rastgele kalır. Fonksiyon tarayıcıda çalışır, bu yüzden ihtiyaç duyduğu puan özetini (`UzmanOzeti` içine `puan_ortalama`, `puan_sayisi`) sunucu `index.tsx` üzerinden verir.
- `/on-gorusme` listesi bu işin kapsamında değil, alfabetik kalır (benim kararım; istenirse aynı fonksiyon kullanılır).

Sıralama fonksiyonu saf (yan etkisiz) bir TypeScript fonksiyonu olur ve `scripts/*.test.mts` altında test edilir. Testte rastgelelik dışarıdan verilir, `karistir`'daki gibi.

### Gösterim

- Danışan ağırlıklı puanı görmez. **Gerçek ortalamayı** (bir ondalık, Türkçe virgül: `4,2`) ve değerlendirme sayısını görür.
- Yıldızlar ortalamayı **en yakın yarım yıldıza** yuvarlar (benim kararım).
- Puanı olmayan bağımsız uzmanda ve öğrenci uzmanda yıldız ve "henüz değerlendirme yok" gibi bir yazı **görünmez**.
- Erişilebilirlik: yıldız grubu `aria-hidden`, yanında ekran okuyucu için metin bulunur, ör. "5 üzerinden 4,2, 100 değerlendirme".

### Pencere ("Son görüşmeni değerlendir")

- Danışan rolüyle giriş yapmış kullanıcı siteye girdiğinde bir uzman için şu şartlar sağlanıyorsa açılır:
  1. Puan verme şartı sağlanıyor.
  2. Danışan o uzmana henüz puan vermemiş.
  3. Danışan bu pencereyi o uzman için daha önce kapatmamış.
- Birden fazla uzman şartı sağlıyorsa, en son tamamlanan seansın uzmanı seçilir. Tek seferde tek pencere açılır.
- "Daha sonra" ile kapatılan pencere o uzman için bir daha çıkmaz (kullanıcı onayladı). Danışan istediği zaman profilden puan verebilir. Kapatma bilgisi sunucuda tutulmalı ki başka cihazda pencere tekrar çıkmasın. Bunun için `dismissed_at` alanı veya ayrı bir tablo kullanılabilir, seçim builder'a bırakıldı.
- Esc tuşu ve pencere dışına tıklama **"Daha sonra" sayılmaz**. Pencereyi yalnızca o ziyaret için kapatır, bilgi tarayıcı oturumunda (`sessionStorage`) tutulur. Danışan siteye sonra tekrar girdiğinde pencere yeniden çıkar. Kalıcı kapatma yalnızca "Daha sonra" düğmesiyle olur (benim kararım: yanlışlıkla basılan Esc hatırlatmayı sonsuza kadar kapatmamalı).
- Şart her sayfa isteğinde kontrol edilebilir: yalnızca giriş yapmış danışan için, tek ve küçük bir sorgudur. Pencereyi ziyaret içinde tekrar göstermemek tarayıcı tarafının işidir.
- Danışan uzmanı zaten puanladıysa sonraki seanslardan sonra pencere çıkmaz.
- Pencere metni: başlık "Son görüşmeni değerlendir". Altında "{Uzman adı} ile görüşmeniz nasıldı? Puanınız uzmanın profilinde yalnızca ortalama olarak görünür, adınız görünmez." Düğmeler: "Daha sonra" ve "Gönder".
- Ölçek davet penceresiyle (`src/modules/olcek/OlcekPenceresi.tsx`, ana sayfa) aynı anda açılmamalı. Puan penceresi açıksa ölçek daveti o ziyarette gösterilmez (benim kararım).
- Pencere, mevcut site pencereleriyle aynı erişilebilirlik kurallarına uyar: odak pencereye taşınır, Esc ile kapanır, odak pencereden dışarı kaçmaz.

### Puan verme bileşeni

- 5 yıldız, altında gerçekte radio düğmeleri vardır. Klavye ve ekran okuyucuyla çalışır.
- Fare bir yıldızın üstündeyken **o yıldız büyür** (scale 1,3) ve o yıldıza kadar olanlar sarıya boyanır. Altta anlamı yazar:
  1 · Hiç memnun değilim, 2 · Memnun değilim, 3 · Orta, 4 · Memnunum, 5 · Çok memnunum.
- Klavye odağı da fareyle aynı büyütmeyi ve odak çerçevesini (`#2F5D50`) gösterir.
- Profilde, şartı sağlayan danışan aynı bileşeni görür. Daha önce puan verdiyse kendi puanı seçili gelir ve güncelleyebilir. Şartı sağlamayan ziyaretçi bileşeni görmez.
- Başarı mesajı ✓ içerir, yalnızca renge güvenmez.

### Yıldız görünümü ve animasyon (kullanıcı onayladı, görsel örnek: `.superpowers/brainstorm/.../yildiz-animasyon-v2.html`)

- Dolu yıldız: dolgu `#F5B82E`, kenar `#9A6B00` (1,4 px). Boş yıldız: beyaz dolgu, aynı kenar. Kenar, sarının beyaz zeminde kaybolmaması için şarttır.
- Animasyon sitenin "saniyede 18 kare" düzenindedir (`--kare: calc(1s / 18)`, `steps()`; bkz. `src/app/globals.css`):
  1. **Belirme:** yıldızlar soldan sağa sırayla belirir. Her yıldız 6 kare sürer, `scale(0.4)` ve `opacity .3` değerinden `scale(1)` değerine gelir, yıldızlar arasında 4 kare fark vardır.
  2. **Nefes:** hepsi belirince her yıldız `scale(1)` ile `scale(0.88)` arasında 36 karelik nefes hareketine başlar (`infinite alternate`). Yıldızlar arasında 7 kare fark vardır.
- Puan verme bileşenindeki yıldızlar nefes almaz. Yalnızca üstüne gelinince büyür.
- `prefers-reduced-motion: reduce` açıkken animasyon olmaz. `globals.css` içindeki genel kural bunu zaten sağlıyor.

## Veri ve gizlilik

- Yeni tablo (ad önerisi `expert_ratings`): `id`, `expert_id`, `client_id` (boş olabilir), `rating smallint check (1..5)`, `created_at`, `updated_at`. Benzersizlik `(expert_id, client_id)`.
- **Danışan hesabını silerse puan silinmez** (kullanıcı kararı): `client_id` için `on delete set null` kullanılır, puan anonim olarak kalır ve ortalamaya katılmaya devam eder.
- Uzman hesabı silinirse puanları da silinir (`on delete cascade`, benim kararım). Uzman onayı kalkarsa vitrinde görünmez, puanları da görünmez. Kayıtlar durur.
- RLS açık:
  - Danışan yalnızca **kendi** puan satırını okuyabilir.
  - Kimse başkasının satırını okuyamaz, uzman ve admin dahil. Uzman bilerek dahil edilmedi; admin'e de gerek yok.
  - Herkese açık olan yalnızca uzman başına **özet** bilgisidir (`puan_ortalama`, `puan_sayisi`). Bu özet `uzman_vitrini` görünümüne eklenir veya ayrı bir görünüm/fonksiyonla verilir.
  - Yazma yalnızca şartı kontrol eden bir fonksiyon (`security definer`) veya sunucu eylemi üzerinden yapılır. Tabloya doğrudan `insert`/`update` izni verilmemeli. Bu, projedeki uzman profili kuralıyla aynı yaklaşımdır.
- Kötüye kullanım için hız sınırı: projedeki mevcut hız sınırı düzeni (`0008_hiz_sinirlari.sql`) kullanılabilir.
- Puan sağlık verisi değildir, ama log'lara ve hata mesajlarına yazılmaz.
- Uzmanın yalnızca 2–3 danışanı varsa, ortalamadan kimin ne verdiğini tahmin edebilir. Bu risk kabul edildi. İstenirse ileride "en az 3 değerlendirme olunca göster" kuralı eklenebilir (benim notum, kapsam dışı).

## Kurallarda yapılacak değişiklikler

- `CLAUDE.md` §6 son madde: "Uzmanlar arasında eşit rekabet: ölçek sonucu ve /uzmanlar listesi rastgele sıralanır" cümlesi yeni puan kuralıyla güncellenir. Puansız uzmanlar ve öğrenci uzmanlar rastgele kalır, eşleşen alan sayısı yine sıralamayı etkilemez.
- `src/lib/karistir.ts` içindeki "eşit rekabet" yorumu güncellenir.
- `/kullanim-kosullari`, `/gizlilik` ve `/sss` taslak metinlerine puanlamayla ilgili kısa bilgi eklenir. Puanın anonim kaldığı ve hesap silinince de durduğu yazılır. Bu metinler `KVKK_METINLERI_ONAYLI` onayına bağlı taslaklardır.
- Etik: kullanıcı, psikolog etik kodları açısından danışan puanlamasında sorun olmadığını belirtti (2026-11-08).
- `npm run test-verisi` puan verisi de üretmeli ki sıralama demoda görünsün.

## Builder'a bırakılanlar

- Tablo, fonksiyon ve görünüm adları; özetin vitrin görünümüne mi ayrı bir görünüme mi ekleneceği.
- Pencerenin kapatılma bilgisinin nerede tutulacağı.
- Bileşen dosya adları (öneri: `src/components/Yildizlar.tsx` gösterim için, `src/components/PuanVer.tsx` giriş için).
- Pencerenin hangi katmandan tetikleneceği: `layout.tsx` içinde sunucu tarafında kontrol edip istemci bileşeni açmak gibi.
- Migration numarası: sıradaki `0020`.
