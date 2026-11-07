# Seans takvimi, plan ve grup seansları: tasarım

Tarih: 2026-11-07. Proje kuralları için `CLAUDE.md` geçerlidir. Çelişki varsa bu belgedeki kullanıcı kararları yeni karardır ve `CLAUDE.md` buna göre güncellenir.

İşaretler: **[K]** proje sahibinin kararı. **[Ö]** Claude önerdi, proje sahibi kabul etti. **[Y]** Claude'un kendi kararı, proje sahibi henüz görmedi.

## 1. Amaç

Danışan bugün uzmana "hafta içi akşam" gibi kaba bir zamanla başvuruyor. Uzman da sohbetten istediği an istediği bağlantıyı paylaşıyor ve ücret kaydı yok.

Hedef:

- Danışan, uzmanın gerçekten müsait olduğu saati görüp o saate başvurabilsin.
- Görüşme şekli, seans süresi ve seans türü profilde görünsün.
- Her ücretli seans, tarih ve saat taşıyan bir planla kesinleşsin.
- **Uzman aynı saati birden çok kişiye satıp parayı alıp kaçamasın [K].** Bu, işin ana sebebidir.

Portfolyo düzeyinde bir projedir. Gerçek para hareketi yoktur.

## 2. Kapsam ve teslim sırası

İki aşama, iki ayrı commit **[K]**:

1. **Bireysel aşama:** görüşme bilgileri, takvim, saatli başvuru, ön görüşme bağlantısı sınırı, plan, seans randevusu, demo ödeme, bekletme ve yönetici kararı, iptal, seans bağlantısı, bulut ve güneş.
2. **Grup aşaması:** grup seansı açma, listeleme, katılma, 3-12 kontenjan, iptal.

### Yapılmayacaklar

- Yüz yüze seans için plan, başvuru veya takvim **[K]**.
- Açık adres **[K]**.
- Gerçek ödeme ve kart bilgisi **[K]**.
- Sitenin kendi görüntülü görüşme sistemi (`CLAUDE.md`).
- E-posta bildirimi (`CLAUDE.md`).
- Tek bir günü ayrıca kapatma **[Ö]**.
- Dakikalı başlangıç saatleri **[Ö]**.
- Grup içi mesajlaşma **[Ö]**.

### Başarısızlık sayılacak durumlar

- Aynı uzmanın çakışan iki seansının, aynı anda gönderilmiş olsa bile kaydedilebilmesi.
- Öğrenci uzman ekranında ücret, fiyat veya ödeme görünmesi.
- `ODEME_MODULU_AKTIF=false` iken kırık bağlantı, hata veya ödeme izi kalması.
- Danışanın, uzmanın başka kimlerle görüştüğünü öğrenebilmesi.
- Demo ödemenin gerçek ödeme gibi görünmesi.

## 3. Uzman profili: görüşme bilgileri

Uzman panelinde düzenlenir. Kayıt sunucudan yapılır, tabloya yazma izni verilmez (`profilGuncelle` düzeni). Vitrine (`uzman_vitrini`) yeni sütunlar eklenir.

- **Görüşme şekli [K]:** Online ve/veya Yüz yüze. En az biri seçilmelidir **[Y]**.
- **Yüz yüze konumu [K]:** Yalnızca şehir ve ilçe. Profilde "Yüz yüze görüşme: Kadıköy, İstanbul" diye görünür. Danışan isterse uzmanı site dışında kendisi arar. Şehir 81 ilden seçilir. İlçe yalnızca harf ve boşluk içeren, en fazla 40 karakterlik metindir, böylece telefon numarası yazılamaz **[Y]**.
- **Seans süresi [K]:** Profilde bir kez belirtilir. Seçenekler: 30, 45, 50, 60, 90, 120 dakika **[Y]**. Süre değişirse gönderilmiş planlar eski süresini korur **[Y]**.
- **Seans türü [K]:** Birinci aşamada her uzmanda "Bireysel" etiketi görünür. Grup etiketi ikinci aşamada, uzmanın açık grup seansı varsa görünür. Öğrenci uzmanda hiçbir zaman görünmez.

Mevcut uzmanlar: online açık, süre boş ve takvim boş başlar. Süre veya uygun saat girilene kadar profilde "Uzman henüz uygun saat belirtmedi" yazar ve başvuru yapılamaz **[Y]**.

## 4. Takvim

### Uzman tarafı [Ö]

Panelde boş haftalık tablo. Satırlar 08:00-21:00 arası başlangıç saatleri, sütunlar pazartesi-pazar. Uzman kutulara tıklayarak saat açıp kapatır. Düzen her hafta tekrar eder.

### Danışan tarafı [K]

Profilde A düzeni: haftalık tablo, üstte gün adı ve tarih (`Sal 10.11`).

- **Gri kutu içinde saat varsa müsait.** Onay işareti kullanılmaz.
- **Kutu yoksa müsait değil veya görüşmesi var.** Danışan bu ikisini ayırt edemez.
- Seçilen kutu koyu adaçayı olur, altındaki düğme "Salı 10.11.2026 14:00 için başvur" der.
- Önceki/sonraki hafta düğmeleriyle **4 hafta** görünür **[Ö]**.
- Geçmiş saatler görünmez.

Örnek çizim: bu belgenin dayandığı beyin fırtınasındaki "Düzeltilmiş A" ekranı.

Her saat kutusu gerçek bir düğmedir; ekran okuyucu etiketi tam tarih ve saati söyler, seçili durum bildirilir. Dar telefon ekranında kutular dokunulamayacak kadar küçülürse tablo kendi kartı içinde yana kayar, sayfanın tamamı kaymaz **[Y]**.

Giriş yapmamış kişi takvimi görür, başvurmak için mevcut giriş/kayıt yazısını görür **[Y]**.

### Saatin görünmesi

Müsait saatler = haftalık düzen − kapalı aralıklar − geçmiş saatler. Seans bir saatten uzunsa üst üste gelen tüm başlangıç saatleri kapanır **[Ö]**. Örnek: 14:00'te 50 dakikalık seans 14:00'ü kapatır; 90 dakikalık seans 14:00 ve 15:00'ü kapatır.

Bu bilgi herkese açık okunur, bu yüzden veritabanı fonksiyonu **yalnızca müsait başlangıç saatlerini** döndürür. Kimin, hangi seans için, hangi durumda olduğu asla döndürülmez **[Y]**.

Yalnızca yüz yüze çalışan uzmanda takvim görünmez, "Bu uzman yalnızca yüz yüze görüşüyor, site üzerinden randevu alınamaz" yazar ve başvuru yapılamaz **[Ö]**.

### Saat dilimi

Tüm saatler Türkiye saatidir (`Europe/Istanbul`). Veritabanında `timestamptz` tutulur **[Y]**.

### Bulut ve güneş [K]

Takvimin altında, yalnızca uzman profilinde **[Y]** süs SVG'si: güneş yavaşça döner, bulut hafifçe yana kayar. `aria-hidden`, yeni dosya `src/components/BulutGunes.tsx`, animasyon `globals.css` içinde mevcut 18 kare/saniye düzeniyle. "Hareketi azalt" mevcut kuralla kapanır.

## 5. Başvuru

Eski "uygun zaman" seçimi kalkar, yerine takvimden tam tarih ve saat gelir. Konu seçimi isteğe bağlı olarak kalır (serbest metin yok). `applications.requested_start` eklenir, `availability` yeni kayıtlar için boş olabilir ve eski başvurular eski metinle gösterilmeye devam eder **[Y]**.

Sunucu ve veritabanı denetler: saat gelecekte, 4 hafta içinde, uzmanın düzeninde ve açık olmalı **[Y]**. Mevcut kurallar sürer: aynı uzmana tek bekleyen başvuru, hız sınırı.

Başvuru **saati kapatmaz**, yalnızca istektir **[K]**. Aynı saate birden çok danışan başvurabilir, kararı uzman verir.

Bağımsız uzmanda seçilen saat yalnızca danışanın tercihidir. Plan formunda hazır gelir, uzman değiştirebilir. Ön görüşme başvurudan ayrı bir kayıt değildir, takvimde saat tutmaz, zamanını taraflar sohbette konuşur **[Y]**. Formda bu durum "Bu saat bir istektir, kesin saati uzman plana yazar" diye belirtilir.

Uzman panelindeki başvuru satırında istenen tarih ve saat görünür.

### Kabul

- **Bağımsız uzman:** Kabul sohbeti açar (bugünkü gibi), saat kapanmaz. Saati plan kapatır.
- **Öğrenci uzman [K]:** Kabul sohbeti açar ve o saati kapatan onaylı bir seans oluşturur. Saat geçmiş veya dolmuşsa kabul edilemez, ekranda sebebi yazar, yalnızca reddedilebilir **[Y]**.

## 6. Ön görüşme bağlantısı

- Yalnızca `offers_free_intro` açık bağımsız uzmanlarda görünür **[Ö]**. Kapalıysa uzman doğrudan plan yollar.
- Uzman, sohbet başına **bir kez** görüntülü görüşme bağlantısı yollayabilir **[K]**. Yollandıktan sonra değiştirilemez, ikinci kez yollanamaz. Kural veritabanında da uygulanır.
- Mevcut `conversations.meeting_url` alanı bu iş için kullanılır. Bugün dolu olan kayıtlar "yollanmış" sayılır **[Y]**.
- Sohbette ilk seans kesinleşince bu bağlantı danışana gösterilmez, böylece ücretsiz bağlantı ücretli seans yerine kullanılamaz **[Y]**.
- Adres denetimi mevcut `src/lib/gorusme.ts` ile yapılır.
- Mesajlaşma her durumda açık kalır **[Ö]**.

Öğrenci uzmanlarda bu form kalkar, bağlantıyı randevu kartından paylaşırlar.

## 7. Plan ve seans randevusu

Sohbet sayfasında, mesaj olarak değil kart olarak görünür. Şifreli mesajlarla karışmaz (`CLAUDE.md`: site eki olarak teklif).

### Plan (bağımsız uzman) [K]

Uzman her seans için ayrı plan yollar **[Ö]**. İçerik: gerçek tarih ve saat (`17.11.2026 14:00`), profildeki süre, seans başı ücret (`1.200 ₺`). Ücret tam TL, 1 ile 10.000 arası **[K]**.

Saat bir saat başı olmalı, 08:00-21:00 arasında başlamalı, gelecekte ve 4 hafta içinde olmalıdır. Uzman kararı olduğu için haftalık düzende olması gerekmez, ama çakışamaz **[Y]**.

### Seans randevusu (öğrenci uzman) [Ö]

Aynı kart, ücret alanı yok. Ücret, ödeme ve komisyonla ilgili hiçbir şey görünmez. Veritabanı, öğrenci uzman kaydında ücretin boş olmasını zorunlu kılar.

### Durumlar

```
gönderildi ──onay──> ödeme bekliyor ──demo ödeme──> kesinleşti ──> (iptal edildi)
    │                     │
    ├──ret──> reddedildi  └──süre doldu──> süresi doldu
    └──süre doldu──> süresi doldu
```

- Öğrenci randevusunda ve `ODEME_MODULU_AKTIF=false` iken onay doğrudan "kesinleşti"ye geçer.
- **Saat, gönderildiği anda kapanır [Ö].** Reddedilirse veya süresi dolarsa açılır.
- Süre 24 saattir **[Ö]**. Seans daha yakınsa süre seans başlangıcında biter **[Y]**. "Ödeme bekliyor" durumu süreyi uzatmaz **[Y]**.
- Reddedilen veya süresi dolan bir planın ardından uzman yeni plan yollayabilir **[K]**.
- Süresi geçmiş kayıtlar, durumu henüz güncellenmemiş olsa bile hem okumada hem yazmada boş saat sayılır **[Y]**. Durumlar 0013'teki `pg_cron` ile de düzenli güncellenir.
- Uzman, danışan yanıtlamadan önce yolladığı planı **geri çekebilir**, saat hemen açılır. Böylece yanlış fiyat veya saat 24 saat beklemez **[Y]**.

### Çakışma kuralı [Ö]

Kural veritabanında uygulanır, aynı anda gönderilen iki plandan yalnızca biri geçer. Aynı uzmanın "gönderildi, ödeme bekliyor, kesinleşti" durumundaki seans aralıkları çakışamaz. Örnek: 14:00'te 50 dakikalık seans varken 14:30 kabul edilmez. Yöntem olarak PostgreSQL `exclude` kısıtı (`btree_gist`) önerilir; süresi geçmiş kayıtlar kısıtı meşgul etmesin diye kayıt fonksiyonu önce onları "süresi doldu" yapar **[Y]**.

### Kim ne yapabilir

- Yazma yalnızca sunucudan, kişi ve sohbet denetiminden sonra yapılır. Kullanıcılara tabloya yazma izni verilmez.
- Satırları yalnızca sohbetin iki tarafı görür. **Admin'e genel okuma yetkisi verilmez**. Tek istisna bölüm 8'deki "Seans yapılmadı" incelemesidir **[K]**.
- Uzman onayı kalkmış veya süresi geçmişse yeni plan yollanamaz **[Y]**. Uzman ayrılmış sohbette plan yollanamaz.
- Plan gönderimi için hız sınırı uygulanır (`HIZ_SINIRI` düzeni) **[Y]**.

### Seans bağlantısı [K]

Seans kesinleşince uzman kartın içine görüşme bağlantısını ekler, danışan kartta "Görüşmeye katıl" düğmesini görür. Her seans için ayrıdır, uzman değiştirebilir **[Y]**. Adres denetimi `gorusme.ts`. Herkese açık profilde görünmez. Görüntülü görüşmeye geçiş buradan yapılır **[K]**.

`OdemeUyarisi` yalnızca bağımsız uzman sohbetlerinde görünmeye devam eder. Ödeme modülü açıkken "yakında açılacaktır" cümlesi gösterilmez.

### Site dışına ödeme yönlendirmesi [K]

Tamamen engellenemez, çünkü danışan uzmanı site dışında da bulabilir. Dört önlem alınır:

- **Otomatik mesaj kontrolü [K]:** Sunucu, mesajı şifrelemeden önce IBAN ve telefon numarası kalıplarını arar (`mesajGonder`). Bulursa sohbeti `conversation_flags` tablosuna `source='auto_moderation'`, `detector`, `message_id` ile işaretler. Yalnızca **bağımsız uzmanın yazdığı** mesajlar kontrol edilir; danışan mesajları ve öğrenci uzman sohbetleri kontrol edilmez **[Y]**. Mesaj engellenmez, karşı tarafa bildirim gitmez. Bulunan metin işarete veya log'a yazılmaz. İşaretleme başarısız olursa mesaj yine gönderilir **[Y]**. İşaret tek başına yaptırım değildir; yönetici mevcut sebepli, 30 dakikalık erişimle bakar. Aydınlatma metni, açık rıza metni ve onay ekranındaki açıklama buna göre değişir, sürümler yükseltilir, kullanıcılar yeniden onaylar. Kalıp araması saf bir işlevdir ve testi olur.

- **Açık uyarı:** Profilde yüz yüze bilgisinin yanında "Yüz yüze görüşme ve ödeme site dışındadır, iade ve koruma kapsamında değildir" yazar (`<OnayGerekir />` ile).
- **Koruma vurgusu:** Plan kartında "Site içi ödemede saat güvencesi ve iade hakkınız vardır" yazar. Öğrenci randevusunda ve ödeme modülü kapalıyken görünmez **[Y]**.
- **Şikayet ve yaptırım:** Şikayet formuna "Site dışına ödeme yönlendirmesi" sebebi eklenir (`SIKAYET_KATEGORILERI` ve veritabanı). Öğrenci uzman sohbetlerinde görünmez **[Y]**. Yönetici işaretli sohbeti mevcut sebepli erişimle inceler. Kanıt varsa uzmanın hesabını kapatır, kanıt yoksa iki tarafa da yaptırım olmaz (`CLAUDE.md`, 2026-11-07). Kapatma, mevcut uzman reddetme işlemi kullanılarak yapılır ve bölüm 10'daki "uzman onayı kalkarsa" kuralları çalışır. Karar `admin_audit_log` kaydına yazılır **[Y]**.

### İptal [Ö]

Taraflar kesinleşmiş seansı kart üzerinden, seans başlamadan iptal edebilir. Serbest metin sebep istenmez **[Y]**.

| Seansa kalan süre | Kim iptal eder | Demo ödeme | Saat |
|---|---|---|---|
| 24 saatten fazla | Danışan veya uzman | İade sayılır | Açılır |
| 24 saatten az | Danışan | İade yok | Açılır **[Y]** |
| 24 saatten az | Uzman | İade sayılır | Açılır |

Öğrenci randevusunda aynı akış çalışır, iade ve ücret sözü geçmez.

## 8. Demo ödeme modülü

Ölçek modülü düzeninde: `src/modules/odeme/` altında durur, `.env` içinde `ODEME_MODULU_AKTIF=true` ile açılır **[Ö]**. Değer yoksa kapalıdır.

### Açıkken

- Danışan planı onaylayınca "Demo ödeme" adımını görür: tutar ve "Öde (demo)" düğmesi.
- Ekranda açıkça "Bu bir demodur, para çekilmez" yazar.
- **Kart bilgisi veya başka hiçbir ödeme bilgisi istenmez.**
- Ayrı tabloda tutar, %5 komisyon ve uzmana kalan tutar kayıt olarak tutulur **[Ö]**. Tutarlar kuruş olarak tam sayı tutulur **[Y]**.

### Bekletme ve yönetici kararı [K]

Uzman görüşmeye gelmezse danışan korunur.

```
bekletmede ──seans + 48 saat, şikayet yok──> uzmana aktarıldı
    │
    ├──iptal (bölüm 7)──> iade edildi veya iade yok
    └──"Seans yapılmadı"──> incelemede ──yönetici──> iade edildi veya uzmana aktarıldı
```

- Ödeme, seans bitiminden 48 saat sonrasına kadar "bekletmede" kalır, uzmana aktarılmış sayılmaz. Otomatik aktarım `pg_cron` ile yapılır **[Y]**.
- Danışan bu süre içinde kartta **"Seans yapılmadı"** düğmesine basabilir. Düğme seans başlangıcından önce görünmez, serbest metin istemez **[Y]**.
- Düğme, ilgili seansa bağlı olarak `conversation_flags` tablosuna kullanıcı şikayeti kaydı düşer (yeni kategori `seans_yapilmadi`). Mevcut açık şikayet kuralları çalışır: hesap silme ve sohbet silme engellenir.
- Yönetici yalnızca bu şekilde işaretlenmiş seansın kartını görür: tarih, saat, süre, tutar, bağlantının eklenip eklenmediği (adresin kendisi değil), durum **[Y]**. Kişi adları sohbet başlığındaki gibi görünür. Mesajlara erişim için mevcut sebepli, 30 dakikalık kural aynen geçerlidir.
- Yönetici **"İade et"** veya **"Uzmana aktar"** der, sebep yazar. Yetki `adminKullanici()` ile denetlenir (`aal2`). Karar `admin_audit_log` kaydına yazılır, ilgili işaret kapanır **[K]**.
- Öğrenci randevularında ve modül kapalıyken para olmadığı için bu düğme görünmez. Danışan mevcut şikayet formunu kullanır **[Y]**.

### Kapalıyken

Plan ve onay çalışır, ödeme adımı ve komisyon görünmez, onay doğrudan seansı kesinleştirir **[Ö]**. Ödeme parçası dışında hiçbir kod bu modüle bağımlı olmaz. Modül klasörü ve tablosu tamamen kaldırılsa bile diğer özellikler bozulmaz.

Gerçek ödeme kuruluşu bağlanırken yapılacaklar `YAYIN-ONCESI.md` dosyasına yazılır.

## 9. Grup seansları (ikinci aşama)

Danışan saat seçip başvurmaz, uzmanın açtığı seansa katılır **[K]**.

- **Yalnızca bağımsız uzman açabilir [K].** Öğrenci uzmana bu seçenek kapalıdır, sunucu ve veritabanı da reddeder.
- Uzman **amacı ve konuyu açıkça** yazar **[K]**. Konu `ALANLAR` listesinden, amaç en fazla 500 karakter metin **[Y]**. Herkese açıktır, tanıtım yazısı gibi yönetici sonradan kontrol eder (0015 düzeni) **[Y]**.
- Ayrıca: tarih ve saat, süre, kişi başı ücret.
- **En az 3, en fazla 12 kişi [K].** Uzman bu sınırları değiştiremez **[Y]**. 12 kişi dolunca katılım kapanır **[Ö]**.
- Grup seansı uzmanın takviminde saat tutar, bireysel seanslarla aynı çakışma kuralına uyar **[Ö]**. Birinci aşamanın veri yapısı buna izin verecek şekilde kurulur.
- Danışan listeden veya uzman profilinden katılır, uzman onayı gerekmez **[K]**. **Yer, ancak önceden ödeme yapılınca ayrılır [K]**; ödemesi tamamlanmayan kişi kontenjana sayılmaz. Modül kapalıyken ödeme adımı olmadığı için katılım doğrudan yer ayırır **[Y]**. Sohbet açılmaz, bu yüzden KVKK onayı katılım anında istenir **[Y]**.
- **Son katılım zamanı** seansa 12 saat kalana kadardır **[K]**. Bu anda 3 kişi yoksa seans iptal edilir, demo ödemeler iade sayılır, saat açılır **[Ö]**.
- İptal kuralları bireysel seansla aynıdır **[Y]**. Katılımcı iptali sonrası sayı 3'ün altına düşerse son katılım zamanına kadar yeniden kişi alınabilir. Son katılım zamanından sonra sayı 3'ün altına düşerse seans herkes için iptal olur, çünkü 3 kişinin altında seans yapılamaz **[K]**. Diğer katılımcıların ödemesi iade sayılır, iptal eden kişi 24 saatten az kuralına tabidir **[Y]**.
- Bekletme ve yönetici kararı (bölüm 8) her katılımcının ödemesi için ayrı çalışır. Grup seansında sohbet olmadığı için şikayet kaydı sohbete değil grup seansına bağlanır ve yönetici yalnızca seans kartını görür **[Y]**.
- **Gizlilik [Ö]:** Danışanlar birbirinin adını görmez, adları yalnızca uzman görür. Grup içi mesajlaşma yoktur. Görüşme bağlantısını uzman ekler, yalnızca katılımcılar görür.
- Yeni sayfa: `/grup-seanslari`. Üst menüye bağlantı eklenir **[Y]**.

## 10. Bildirim, silme, saklama, KVKK

- **Bildirim:** Yanıt bekleyen plan sayısı danışanın mesaj sayacına eklenir. Yalnızca sayı gösterilir (`CLAUDE.md`) **[Y]**.
- **Danışan silinirse:** Sohbet ve seans kayıtları silinir, gelecek saatler açılır. Grup yeri boşalır.
- **Uzman silinirse:** Gelecek seanslar iptal edilir, gelecek seansların ve bekletmedeki geçmiş seansların demo ödemeleri iade sayılır, görüşme bağlantıları silinir. `conversations.application_id` boşaltılmaz (`CLAUDE.md`). Açık grup seansları iptal edilir **[Y]**.
- **Uzman onayı kalkarsa:** Reddedilme veya belge süresinin dolması durumunda hesap silmeyle aynı işlem uygulanır: yanıt bekleyen planlar kapanır, gelecek seanslar iptal edilir, demo ödemeler iade sayılır. Belge süresi günlük `pg_cron` işiyle denetlenir **[Y]**.
- **Saklama:** Seans ve demo ödeme kayıtları sohbete bağlıdır (`on delete cascade`). Sohbet silinince onlar da silinir, sohbetten bağımsız "kim kiminle görüştü" kaydı kalmaz. Sohbet daha uzun yaşarsa geçmiş kayıtlar 12 ay sonra silinir, 0013'teki `pg_cron` yöntemi kullanılır **[Y]**. Gerçek ödemeye geçilirse yasal saklama süresi ayrıca ele alınır.
- **Hassas veri:** "Şu kişi şu uzmanla seans yaptı" bilgisi hassastır. Log'lara ve analitiğe yazılmaz. Seans türü veya konu bildirimde görünmez.
- **Metinler:** Aydınlatma metni, gizlilik ve kullanım koşulları yeni veriye ve iptal kuralına göre güncellenir, `KVKK_SURUMU` yükseltilir. İade ve iptal yazılarının yanına `<OnayGerekir />` konur. `/on-gorusme` metni bir kez kuralına göre güncellenir **[Y]**.

## 11. Teknik çerçeve

- Next.js 16, Supabase, mevcut sunucu işlemi (`"use server"`) düzeni. Kod yazmadan önce `AGENTS.md` ve `node_modules/next/dist/docs/` okunur.
- Migration'lar `0016` (bireysel), `0017` (demo ödeme) ve `0018` (grup). Her yeni tabloda RLS açık. Dosyalar tekrar çalıştırılabilir olmalı.
- Tüm metinler Türkçe, tarih `17.11.2026`, saat `14:30`, para `₺`.
- Palet ve kontrast kuralları `CLAUDE.md` bölüm 6'daki gibi.
- `CSP` değişmez, yeni dış kaynak yok.
- Saat hesabı, komisyon ve iptal kuralı içe aktarma gerektirmeyen saf işlevler olarak yazılır, `node --test` ile küçük testleri olur. Yeni bağımlılık eklenmez **[Y]**.
- Güncellenecekler: `scripts/test-verisi.mts`, `.env.example`, `README.md` migration listesi, `YAYIN-ONCESI.md`, `CLAUDE.md`.

### Doğrulama

Her aşamanın sonunda `npm run lint`, `npm run build` ve testler çalışır. Akış, ayarlar varsa uydurma test verisiyle uygulamada denenir. Veritabanı kuralları için migration'ın proje sahibi tarafından Supabase'de çalıştırılması gerekir; çalıştırılamadıysa bu açıkça söylenir.

### Commit

Bireysel aşama bitince bir commit, grup aşaması bitince ayrı bir commit **[K]**. Bu belge ilk commit'e dahildir.

## 12. Uygulayıcıya bırakılanlar

Dosya ve tablo adlandırması, kartların ve panel tablosunun görsel ayrıntısı, tablonun profildeki yerleşimi, hata cümlelerinin ifadesi, bulut ve güneşin çizim ayrıntısı (örnek çizimdeki gibi).
