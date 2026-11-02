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
- Bu bir **öğrenci projesi**; gerçek yayına çıkıp çıkmayacağı belli değil. Gerçek kişi verisi yerine **uydurma test verisi** kullan (`npm run test-verisi`).
- Teknoloji: Next.js 16 + TypeScript + Tailwind, Supabase (kimlik doğrulama, veritabanı, özel dosya depolama). Sunucu bölgesi: **Frankfurt**.
- Next.js 16'da birçok şey değişti. Kod yazmadan önce `AGENTS.md` dosyasına ve `node_modules/next/dist/docs/` klasörüne bak (ör. `middleware` yerine `proxy.ts` kullanılıyor).
- Veritabanı değişiklikleri `supabase/migrations/` klasöründe numaralı SQL dosyaları olarak tutulur. Her tabloda RLS (satır düzeyinde güvenlik) açık olmalı.
- Roller: danışan (`client`), uzman (`expert`), öğrenci uzman (`student_expert`), yönetici (`admin`). Admin rolü kayıt formundan asla seçilemez.
- Öğrenci uzmanlar yalnızca **son sınıf Psikoloji/PDR öğrencileri** olabilir ve **staj kapsamında** hizmet verir. Öğrenci belgesinin geçerlilik tarihi tutulur.
- Mesaj koruması: **B seçeneği**. Ana anahtar Supabase Vault'ta (`mesaj_ana_anahtari`) durur. Her konuşmanın kendi anahtarı vardır ve bu anahtar ana anahtarla sarılır. Mesajlar Node.js'in yerleşik AES-256-GCM yöntemiyle şifrelenir (`src/lib/sifreleme.ts`). Vault'taki sır silinirse mesajlar okunamaz.
- Mesajları **varsayılan olarak sadece iki taraf** okuyabilir (kullanıcı kararı, 2026-10-31; 0004 migration).
  - Admin yalnızca **işaretli** sohbetleri (`conversation_flags`: kullanıcı şikayeti, admin incelemesi, ileride otomatik bot) açabilir.
  - Açmak için sebep yazması gerekir; erişim 30 dakika geçerlidir. Bu kuralı veritabanı `konusma_erisimi_ac` ve `admin_sohbet_okuyabilir` fonksiyonlarıyla uygular.
  - Her erişim değiştirilemez `conversation_access_log` tablosuna yazılır. Belge/onay/ret işlemlerinin kaydı `admin_audit_log` da değiştirilemez ve silinemez (0010). İki kayıt tablosunun da hesaplara bağı (foreign key) bilerek yok; hesap silinse bile kayıt kalır.
  - Admin'e genel okuma yetkisi geri **verilmemeli**.
- İleride eklenecek moderasyon botu, sunucu tarafında `conversation_flags` tablosuna `source='auto_moderation'` ile kayıt ekleyecek (`detector`, `score` ve `message_id` alanları hazır).
- Mesajlaşmadan önce güncel aydınlatma ve açık rıza sürümleri onaylanmış olmalı. Metin değişirse `src/lib/sabitler.ts` içindeki sürüm değiştirilmeli. KVKK metinleri taslaktır; `KVKK_METINLERI_ONAYLI=true` yapılana kadar "Taslaktır" notu görünür.
- Sohbet ekranındaki acil durum numaraları (112, 183, 114) yayından önce resmi kaynaklardan yeniden doğrulanmalı.
- Ödeme site üzerinden yapılacak. Uzman, sohbetin içinden mesaj olarak değil, sitenin bir eki olarak **ödeme planı** gönderir. Site her ödemeden **%5 komisyon** alır. Türkiye'de lisanslı ve alt üye işyeri / pazaryeri desteği olan bir ödeme kuruluşu kullanılmalı. Kart bilgisi asla bizim sunucumuza gelmemeli.
- Görüntülü görüşme şimdilik yok. Trafik iyi olursa ileride eklenebilir.
- Dosyalar: belgeler `uzman-belgeleri`, fotoğraflar `profil-fotograflari` özel deposunda. Yükleme/silme yalnızca sunucuda, içerik imzası kontrol edildikten sonra gizli anahtarlı istemciyle (`src/lib/supabase/yonetici.ts`) yapılır. Belge dosyaları admin kararından sonra silinir. Fotoğraflar `sharp` ile küçültülür ve EXIF bilgisi temizlenir.
- Admin yetkisi yalnızca Supabase SQL Editor'den verilir (README'de anlatılıyor). Uygulama içinden admin atama özelliği eklenmemeli.
- Admin yetkileri iki adımlı doğrulamaya (TOTP, `aal2`) bağlıdır (0006). `my_role()` kod girilmemiş admin oturumu için `null` döner. Uygulamada admin kontrolü için `adminKullanici()` / `adminSayfasiniKoru()` kullanılmalı (`src/app/admin/yetki.ts`).
- Yayın öncesi yapılacaklar `YAYIN-ONCESI.md` dosyasında tutulur.

## 7. Açıklama tarzı
- Proje sahibi kodlamaya yeni başladı.
- Her değişiklikten sonra **ne yapıldığını ve neden yapıldığını sade Türkçe ile** açıkla.
- Teknik terim kullanmak gerekirse kısaca ne anlama geldiğini söyle.
- Kullanıcının kendisinin yapması gereken bir adım varsa (ör. bir komut çalıştırmak, `.env` doldurmak) bunu adım adım yaz.
