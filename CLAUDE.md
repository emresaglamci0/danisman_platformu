# Proje Kuralları

Bu proje, psikolog/danışmanlarla danışanları buluşturan bir web sitesidir.
Aşağıdaki kurallar kalıcıdır ve her çalışmada uyulmalıdır.

## 1. Dil
- Kullanıcı arayüzündeki tüm metinler (butonlar, menüler, hata mesajları, e-postalar, formlar) **Türkçe** olmalı.
- Tarih, saat ve para biçimleri Türkiye standartlarına uygun olmalı (ör. `30.10.2026`, `14:30`, `₺`).

## 2. Ölçek modülü isteğe bağlıdır
- Ölçek (test/anket) içeriği henüz hazır değil.
- Ölçek modülü **ayrı ve isteğe bağlı** bir parça olarak tasarlanmalı; bir ayar (ör. `.env` içinde `OLCEK_MODULU_AKTIF=false`) ile açılıp kapatılabilmeli.
- Site, ölçek modülü **kapalıyken de eksiksiz çalışmalı**. Diğer hiçbir özellik bu modüle bağımlı olmamalı.
- Modül kapalıyken menüde, sayfalarda veya API'de ölçekle ilgili kırık bağlantı ya da hata görünmemeli.

## 3. Hassas veri minimumda
- Yalnızca hizmet için gerçekten gerekli olan veriyi topla. "Belki lazım olur" diye veri isteme.
- Sağlık/psikolojik bilgi, TC kimlik no, açık adres gibi hassas verileri zorunlu olmadıkça toplama.
- Toplanan veri için saklama süresi belirle; kullanıcı hesabını ve verisini silebilmeli.
- Hassas veriler log'lara, hata mesajlarına veya analitik araçlarına yazılmamalı.
- KVKK'ya uygunluk göz önünde bulundurulmalı (aydınlatma metni, açık rıza).

## 4. Şifreleme ve güvenlik
- **Kendi şifreleme algoritmanı asla yazma.**
- Parola saklama için doğrulanmış kütüphaneler kullan (ör. Argon2 veya bcrypt).
- Kimlik doğrulama, ödeme, e-posta, dosya depolama gibi işler için mümkünse güvenilir **yönetilen servisler** tercih et.
- Tüm trafik HTTPS üzerinden olmalı.

## 5. Sırlar (API anahtarları, parolalar, token'lar)
- Sırlar **asla koda yazılmamalı**, git'e gönderilmemeli.
- Tüm sırlar `.env` dosyasında tutulmalı; `.env` dosyası `.gitignore` içinde olmalı.
- Hangi değişkenlerin gerektiğini göstermek için değer içermeyen bir `.env.example` dosyası tutulabilir.

## 6. Proje kararları (2026-10-30)
- Bu bir **öğrenci projesi** ve şimdilik **portfolyo düzeyinde** (kullanıcı kararı, 2026-11-06). Gerçek kişi verisi yerine **uydurma test verisi** kullan (`npm run test-verisi`).
- Teknoloji: Next.js 16 + TypeScript + Tailwind, Supabase (kimlik doğrulama, veritabanı, özel dosya depolama). Sunucu bölgesi: **Frankfurt**.
- Next.js 16'da birçok şey değişti. Kod yazmadan önce `AGENTS.md` dosyasına ve `node_modules/next/dist/docs/` klasörüne bak (ör. `middleware` yerine `proxy.ts` kullanılıyor).
- Veritabanı değişiklikleri `supabase/migrations/` klasöründe numaralı SQL dosyaları olarak tutulur. Her tabloda RLS (satır düzeyinde güvenlik) açık olmalı.
- Roller: danışan (`client`), uzman (`expert`), öğrenci uzman (`student_expert`), yönetici (`admin`). Admin rolü kayıt formundan asla seçilemez.
- Öğrenci uzmanlar yalnızca **PDR 4. sınıf** veya (her sınıftan) **Klinik Psikoloji yüksek lisans** öğrencileri olabilir (kullanıcı kararı, 2026-11-08; 0021) ve **staj kapsamında** hizmet verir. Öğrenci belgesinin geçerlilik tarihi tutulur.
- Mesaj koruması: **B seçeneği**. Ana anahtar Supabase Vault'ta (`mesaj_ana_anahtari`) durur. Her konuşmanın kendi anahtarı vardır ve bu anahtar ana anahtarla sarılır. Mesajlar Node.js'in yerleşik AES-256-GCM yöntemiyle şifrelenir (`src/lib/sifreleme.ts`). Vault'taki sır silinirse mesajlar okunamaz.
- Mesajları **varsayılan olarak sadece iki taraf** okuyabilir (kullanıcı kararı, 2026-10-31; 0004 migration). Tek otomatik istisna, aşağıdaki IBAN ve telefon kalıbı kontrolüdür.
  - Admin yalnızca **işaretli** sohbetleri (`conversation_flags`: kullanıcı şikayeti, admin incelemesi, ileride otomatik bot) açabilir.
  - Açmak için sebep yazması gerekir; erişim 30 dakika geçerlidir. Bu kuralı veritabanı `konusma_erisimi_ac` ve `admin_sohbet_okuyabilir` fonksiyonlarıyla uygular.
  - Her erişim değiştirilemez `conversation_access_log` tablosuna yazılır. Belge/onay/ret işlemlerinin kaydı `admin_audit_log` da değiştirilemez ve silinemez (0010). İki kayıt tablosunun da hesaplara bağı (foreign key) bilerek yok; hesap silinse bile kayıt kalır.
  - Admin'e genel okuma yetkisi geri **verilmemeli**.
- İleride eklenecek moderasyon botu, sunucu tarafında `conversation_flags` tablosuna `source='auto_moderation'` ile kayıt ekleyecek (`detector`, `score` ve `message_id` alanları hazır).
- Mesajlaşmadan önce güncel aydınlatma ve açık rıza sürümleri onaylanmış olmalı. Metin değişirse `src/lib/sabitler.ts` içindeki sürüm değiştirilmeli. KVKK metinleri taslaktır; `KVKK_METINLERI_ONAYLI=true` yapılana kadar "Taslaktır" notu görünür.
- Sohbet ekranındaki acil durum numaraları (112, 183, 114) yayından önce resmi kaynaklardan yeniden doğrulanmalı.
- **Öğrenci uzmanlar ücret almaz** (kullanıcı kararı, 2026-11-02). Görüşmeleri ücretsiz, staj kapsamında yapılır. Öğrenci uzmanlar için ücret alanı, fiyat veya ödeme özelliği eklenmemeli; "uygun fiyatlı" gibi ifadeler kullanılmamalı.
- Staj, süpervizyon, kurum onayı ve hukuki konularda doğrulanmamış hiçbir iddia kesin bilgi gibi yazılmamalı; yanına `<OnayGerekir />` (**[AVUKAT/KURUM ONAYI GEREKİR]**) konmalı. Bu etiket ayarla gizlenmez, onaydan sonra metin elle düzeltilir.
- Yasal metin sayfaları (kullanım koşulları, gizlilik, çerez, hakkımızda, iletişim, SSS, öğrenci uzmanlar) taslaktır ve `src/components/YasalSayfa.tsx` çerçevesini kullanır. Hepsi KVKK metinleriyle birlikte **tek bir onaya** (`KVKK_METINLERI_ONAYLI`) bağlıdır. Çerez onay penceresi yok (yalnızca zorunlu çerezler var); zorunlu olmayan bir çerez veya analitik eklenirse önce onay penceresi eklenmeli ve `/cerezler` güncellenmeli.
- Her sayfada "acil durum hizmeti değildir" bandı görünür (`AcilDurumBandi`). Acil hat numaraları tek yerde: `src/lib/acil-hatlar.ts`.
- E-posta bildirimi şimdilik **yok** (kullanıcı kararı, 2026-11-02).
- Ödeme yalnızca **bağımsız uzmanlar** için, site üzerinden yapılacak (şimdilik demo, aşağıya bakın). Uzman, sohbetin içinden mesaj olarak değil, sitenin bir eki olarak **ödeme planı (teklif)** gönderir. Site her ödemeden **%5 komisyon** alır. Türkiye'de lisanslı ve alt üye işyeri / pazaryeri desteği olan bir ödeme kuruluşu kullanılmalı. Kart bilgisi asla bizim sunucumuza gelmemeli.
- Site dışına ödeme yönlendirmesi: **kanıt varsa** uzmanın hesabı kapatılır; kanıtsız şikayette iki tarafa da yaptırım yapılmaz (kullanıcı kararı, 2026-11-07). Şikayet sebebi `site_disi_odeme`dir; yönetici mevcut uzman reddetme işlemiyle kapatır. Bağımsız uzman sohbetlerinde (ücretsiz ön görüşme dahil) görüşme bağlantısının yanında `OdemeUyarisi` görünür; öğrenci uzman sohbetlerinde görünmemeli.
- Ücretsiz ön görüşme yalnızca **bağımsız uzmanların isteğe bağlı** tercihidir (`offers_free_intro`, 0011; varsayılan kapalı). Yapanlar `/on-gorusme` sayfasında listelenir. Öğrenci uzmanlarda bu tercih yoktur, çünkü tüm görüşmeleri zaten ücretsizdir. Ön görüşme sitedeki mesajlaşma üzerinden yapılır; uzman isterse sohbetten görüntülü görüşme bağlantısı da paylaşabilir (kullanıcı kararı, 2026-11-07; 0014).
- Seans takvimi ve plan (kullanıcı kararı, 2026-11-07; 0016, 0017; tasarım: `docs/superpowers/specs/2026-11-07-seans-takvimi-ve-plan-design.md`):
  - Uzman görüşme şeklini, seans süresini ve haftalık uygun saatlerini panelden belirtir. Yüz yüze **yalnızca bilgi** olarak görünür (şehir ve ilçe); plan, başvuru, takvim veya açık adres içermez.
  - Danışan gri kutudaki saate başvurur. Kutu yoksa uzman müsait değildir veya görüşmesi vardır; danışan ikisini ayırt edememeli (`uzman_musait_saatler` yalnızca saat döndürür).
  - Başvuru saati kapatmaz. Saati plan kapatır, gönderildiği anda; ret, geri çekme veya 24 saat dolunca açılır. Çakışmayı `seans_cakisamaz` kısıtı engeller. Öğrenci uzmanda başvuru kabulü de saati kapatır ve plan yerine ücretsiz "seans randevusu" vardır.
  - Ön görüşme bağlantısı sohbet başına **bir kez** yollanır; seans bağlantıları plan kartından eklenir.
  - İptal: seansa 24 saatten az kala danışan iptal ederse iade yok, diğer tüm iptallerde iade var. Saat her durumda açılır.
- Grup seansları (kullanıcı kararı, 2026-11-07; 0018): yalnızca bağımsız uzman açar, öğrenci uzmana kapalıdır. En az 3, en fazla 12 kişi. Amaç ve konu yazılır; amaç önceden onaylanmaz, yönetici sonradan kontrol eder. Yer önceden ödemeyle ayrılır, uzman onayı yoktur. Son katılım seansa 12 saat kala biter; o an 3 kişi yoksa veya sonradan 3'ün altına düşerse seans herkes için iptal olur. Danışanlar birbirinin adını görmez, grup içi mesajlaşma yoktur. Grup seansı takvimde saat tutar (`session_offers.group_session_id`).
- Ödeme şimdilik **demodur**, para çekilmez, kart bilgisi istenmez. `src/modules/odeme/` ayrı parçadır, `ODEME_MODULU_AKTIF` ile açılır; kaldırılırsa plan ve onay çalışmaya devam etmeli. Ödeme seans bitiminden 48 saat sonra uzmana aktarılmış sayılır. Danışan bu sürede "Seans yapılmadı" diyebilir, yönetici iade veya aktarım kararı verir ve `admin_audit_log` kaydına yazılır. Yönetici yalnızca seansın özetini görür, görüşme adresini görmez.
- Bağımsız uzmanın yazdığı mesajlar, şifrelenmeden önce sunucuda IBAN ve telefon kalıbı için kontrol edilir (`odemeKalibiVar`, kullanıcı kararı 2026-11-07). Bulunursa sohbet `auto_moderation` ile işaretlenir. Mesaj engellenmez, bulunan metin hiçbir yere yazılmaz. Danışan mesajları ve öğrenci uzman sohbetleri kontrol edilmez.
- Uzmanlar panelden yalnızca tanıtım yazısı, çalışma alanları, görüşme bilgileri ve uygun saatleri değiştirir; ad ve unvan belgelerle doğrulandığı için değiştirilemez. Kayıt sunucu üzerinden yapılır (tabloya yazma izni verilmemeli).
- Hesap silme `src/app/panel/hesap-islemleri.ts` içindedir: şifre yeniden sorulur, ilgili sohbette açık şikayet/inceleme varsa engellenir, önce dosyalar sonra hesap silinir. Yönetici hesabı buradan silinemez. Yeni bir tablo kullanıcıya bağlanırsa silme davranışı (`on delete`) düşünülmeli.
- Şifre sıfırlama yanıtı, e-postanın kayıtlı olup olmadığını belli etmemeli.
- Site paleti "Adaçayı ve Kum" (kullanıcı kararı, 2026-11-06): zemin `#F7F5F0`, kart `#FFFFFF`, metin `#1F2A2E`, ikincil metin `#56635F`, ana renk `#2F5D50`, açık adaçayı `#DCE8E1`, şeftali `#F3DDCD`, ince çizgi `#D9D5CB`. Renkler `src/app/globals.css` içinde Tailwind sınıflarına eşlenir (ör. `bg-teal-700` derin adaçayıdır, üstüne beyaz yazı konur). Metin kontrastı en az 4.5 olmalı; form kenarlığı `slate-300`'dür, `slate-200` yalnızca süs çizgisidir. Başlıklar Lora yazı tipiyle yazılır (`next/font`, sitenin kendisinden sunulur). Kırmızı/yeşil yalnızca acil durum, hata ve başarı mesajlarında kalır; başarı mesajı yalnızca renge güvenmez, ✓ içerir.
- Sitenin kendi görüntülü görüşme sistemi olmayacak, çünkü pahalı (kullanıcı kararı, 2026-11-06). Uzman sohbette kendi bağlantısını paylaşır (0014, 0016). İzinli servisler `src/lib/gorusme.ts` içindedir; bağlantı herkese açık profilde gösterilmemeli.
- Uzman tanıtım yazıları önceden onaylanmaz, yönetici **sonradan kontrol eder** (kullanıcı kararı, 2026-11-06; 0015). Kararlar `admin_audit_log` kaydına yazılır.
- Uzman hesabını silince danışan sohbeti kaybetmez (kullanıcı kararı, 2026-11-06; 0013). Sohbet salt okunur kalır, uzmanın adı silinir, 6 ay sonra otomatik silinir, danışan daha önce silebilir. `application_id` **boşaltılmamalı**: sohbet anahtarı bu numarayla şifrelidir, kaybolursa mesajlar okunamaz. Danışan hesabını silerse sohbet tamamen silinir.
- Site içi bildirimler yalnızca **sayı** gösterir, mesaj içeriği veya konu göstermez (0012). Sayaçlar `/bildirimler` adresinden okunur, üst menü `src/components/UstMenu.tsx` içindedir.
- Her sayfada "Demo: gerçek bilgilerinizi girmeyin" uyarısı vardır (`src/app/layout.tsx`).
- Dosyalar: belgeler `uzman-belgeleri`, fotoğraflar `profil-fotograflari` özel deposunda. Yükleme/silme yalnızca sunucuda, içerik imzası kontrol edildikten sonra gizli anahtarlı istemciyle (`src/lib/supabase/yonetici.ts`) yapılır. Belge dosyaları admin kararından sonra silinir. Fotoğraflar `sharp` ile küçültülür ve EXIF bilgisi temizlenir.
- Admin yetkisi yalnızca Supabase SQL Editor'den verilir (README'de anlatılıyor). Uygulama içinden admin atama özelliği eklenmemeli.
- Admin yetkileri iki adımlı doğrulamaya (TOTP, `aal2`) bağlıdır (0006). `my_role()` kod girilmemiş admin oturumu için `null` döner. Uygulamada admin kontrolü için `adminKullanici()` / `adminSayfasiniKoru()` kullanılmalı (`src/app/admin/yetki.ts`).
- Yayın öncesi yapılacaklar `YAYIN-ONCESI.md` dosyasında tutulur.
- Güvenlik başlıkları: İçerik Güvenlik Politikası (CSP, her istekte yeni nonce) `src/proxy.ts` içinde, diğer başlıklar (HSTS, Permissions-Policy vb.) `next.config.ts` içinde. Yeni bir dış kaynak eklenirken (ör. ödeme kuruluşunun ödeme sayfası/iframe'i) CSP'ye sadece o adres eklenmeli. Permissions-Policy'deki `payment=()` gerekirse açılmalı. `'unsafe-inline'` betikler için asla eklenmemeli.
- Psikolojik rahatsızlıklar sayfası ve yeni çalışma alanları (kullanıcı kararı, 2026-11-08; 0019): 12 yeni alan eklendi. "Psikotik bozukluklar" ve "Bağımlılık" öğrenci uzmanlara kapalıdır (`OGRENCIYE_KAPALI_ALANLAR`, `src/lib/sabitler.ts`; kayıt/panel formları, sunucu kontrolü ve 0019 trigger'ı). Sayfadaki ağır rahatsızlık kartları yalnızca `/uzmanlar?alan=...` adresine bağlanır, öğrenci bağlantısı göstermez. Ziyaretçinin seçtiği his düğmeleri tarayıcıdan çıkmaz (URL, depolama, sunucu, log yok). `src/app/psikolojik-rahatsizliklar/veri.ts` içindeki metinler proje sahibi onaylayana kadar taslaktır (`YAYIN-ONCESI.md`).
- Uzman bulma ölçeği (kullanıcı kararı, 2026-11-08; tasarım: docs/superpowers/specs/2026-11-08-uzman-bulma-olcegi-design.md): ölçek modülünde, yanıtlar tarayıcıdan çıkmaz, grup adları görünmez. Risk, psikotik madde veya yüksek bağımlılık yanıtında öğrenci uzmanlar gösterilmez. Maddeler src/modules/olcek/maddeler.ts içindedir ve taslaktır.
- Uzman puanlama (kullanıcı kararı, 2026-11-08; 0020; tasarım: `docs/superpowers/specs/2026-11-08-uzman-puanlama-design.md`): danışan, bağımsız uzmana en az 2 tamamlanmış seanstan sonra 1–5 yıldız verir; yorum yok; öğrenci uzmanlar puanlanmaz. Sıralama `src/lib/siralama.ts` (ağırlıklı puan, C=5, m=3,5; 2,5 altı puansızların altına iner); puansız uzmanlar ve öğrenciler rastgele; eşleşen alan sayısı sıralamayı etkilemez. Puan satırlarını kimse okuyamaz, yalnızca özet herkese açık. Danışan hesabını silince puan anonim kalır. 'Seans yapılmadı' bildirimi sayılan seansı 2'nin altına düşürürse puan silinir.
- Uzmanlar ve öğrenci uzmanlar ayrı sayfalardadır (kullanıcı kararı, 2026-11-08; 0021; tasarım: `docs/superpowers/specs/2026-11-08-uzman-ogrenci-ayrimi-design.md`): `/uzmanlar` ve `/ogrenci-uzmanlar` aynı `UzmanListesi` bileşenini kullanır, hiçbir listede karışmazlar. Unvanlar yalnızca Psikolog ve Psikolojik Danışman'dır. Bilgi sayfası `/ogrenci-uzmanlar/hakkinda` adresindedir.
- Öğrenci uzman bölümü isteğe bağlıdır (kullanıcı kararı, 2026-11-08): `OGRENCI_MODULU_AKTIF` varsayılan `false` (`src/modules/ogrenci/ayar.ts`). Kapalıyken menü, ana sayfa kapısı, liste ve bilgi sayfaları, öğrenci profilleri, kayıt ve başvuru kapanır, metinlerdeki öğrenci cümleleri gizlenir. Veri silinmez; mevcut öğrenci hesapları ve sohbetleri çalışır. Yeni öğrenci içeriği eklenirse bu ayara bağlanmalı.
- Öğrenci uzmana başvuran danışana ciddi durum sorusu sorulur. Liste `src/app/psikolojik-rahatsizliklar/veri.ts` içindeki `agir: true` kartlardan gelir. "Evet" yanıtında başvuru durur. Yanıt **hiçbir yere kaydedilmez, loglanmaz**, uzmana gösterilmez.

## 7. Açıklama tarzı
- Proje sahibi kodlamaya yeni başladı.
- Her değişiklikten sonra **ne yapıldığını ve neden yapıldığını sade Türkçe ile** açıkla.
- Teknik terim kullanmak gerekirse kısaca ne anlama geldiğini söyle.
- Kullanıcının kendisinin yapması gereken bir adım varsa (ör. bir komut çalıştırmak, `.env` doldurmak) bunu adım adım yaz.
