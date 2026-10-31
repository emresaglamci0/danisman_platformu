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
- Mesaj koruması: **B seçeneği**. Mesajlar, yönetilen anahtar servisinden alınan anahtarla ve doğrulanmış bir kütüphaneyle uygulama katmanında şifrelenir.
- Ödeme site üzerinden yapılacak. Uzman, sohbetin içinden mesaj olarak değil, sitenin bir eki olarak **ödeme planı** gönderir. Site her ödemeden **%5 komisyon** alır. Türkiye'de lisanslı ve alt üye işyeri / pazaryeri desteği olan bir ödeme kuruluşu kullanılmalı. Kart bilgisi asla bizim sunucumuza gelmemeli.
- Görüntülü görüşme şimdilik yok. Trafik iyi olursa ileride eklenebilir.

## 7. Açıklama tarzı
- Proje sahibi kodlamaya yeni başladı.
- Her değişiklikten sonra **ne yapıldığını ve neden yapıldığını sade Türkçe ile** açıkla.
- Teknik terim kullanmak gerekirse kısaca ne anlama geldiğini söyle.
- Kullanıcının kendisinin yapması gereken bir adım varsa (ör. bir komut çalıştırmak, `.env` doldurmak) bunu adım adım yaz.
