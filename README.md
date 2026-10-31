# Danışman Buluşma

Psikolog/psikolojik danışmanlarla danışanları buluşturan web sitesi (öğrenci projesi).
Sitedeki tüm uzmanlar ve kullanıcılar **uydurma test verisidir**.

## Bu aşamada neler var?

- Ana sayfa
- Kayıt ve giriş (hesap türü seçimi: Danışan, Uzman, Öğrenci Uzman)
- Onaylı uzmanların listesi ve uzman detay sayfası
- Uzmana başvuru; panelde başvuruları görme, uzman için kabul/ret
- Ölçek modülü: sadece pasif bir pencere, varsayılan olarak kapalı
- KVKK aydınlatma metni (taslak)

## Bilgisayarınızda çalıştırma (Windows PowerShell)

### 1. Supabase projesi oluşturun (bir kez yapılır)

1. https://supabase.com adresinde ücretsiz hesap açın.
2. **New project** düğmesine tıklayın. Proje adı verin, bir veritabanı şifresi belirleyin
   (bir şifre yöneticisinde saklayın) ve **Region** olarak **Central EU (Frankfurt)** seçin.
3. Proje açılınca sol menüden **SQL Editor** > **New query** yolunu izleyin.
   `supabase/migrations/0001_baslangic.sql` dosyasının tamamını kopyalayıp yapıştırın ve **Run** düğmesine basın.
   "Success" yazısını görmelisiniz.
4. **Authentication** > **Sign In / Providers** > **Email** bölümünde **Confirm email** seçeneğini
   kapatın. Bu adım yalnızca test içindir: Supabase'in ücretsiz e-posta gönderimi saatte birkaç e-postayla sınırlı.
5. **Project Settings** > **API Keys** sayfasından şunları kopyalayın:
   - **Publishable key** (`sb_publishable_...` ile başlar)
   - **Secret key** (`sb_secret_...` ile başlar, **gizlidir**)
   - Proje adresi (`https://xxxx.supabase.co`): **Project Settings** > **Data API** sayfasında
     veya üstteki **Connect** düğmesinde bulunur.

### 2. Projeyi çalıştırın

```powershell
cd "D:\web sitesi geliştirme"
npm install
Copy-Item .env.example .env.local
notepad .env.local
```

Not Defteri'nde açılan `.env.local` dosyasını kopyaladığınız bilgilerle doldurun. Ayrıca
`SEED_TEST_SIFRESI` satırına test hesapları için en az 8 karakterlik bir şifre yazın. Sonra dosyayı kaydedip kapatın.

```powershell
npm run test-verisi
npm run dev
```

Tarayıcıda **http://localhost:3000** adresini açın. Sunucuyu durdurmak için PowerShell penceresinde `Ctrl + C` tuşlarına basın.

### Test hesapları

Tüm test hesaplarının şifresi, `.env.local` dosyasına yazdığınız `SEED_TEST_SIFRESI` değeridir.

| E-posta | Rol |
|---|---|
| test.danisan@example.com | Danışan |
| test.uzman1@example.com … test.uzman4@example.com | Uzman (onaylı) |
| test.ogrenci1@example.com, test.ogrenci2@example.com | Öğrenci uzman (onaylı) |

### Sık karşılaşılan sorunlar

- **"running scripts is disabled on this system"**: PowerShell, npm'in betiklerini engelliyor.
  Bir kez şu komutu çalıştırın: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- **Sayfanın üstünde sarı "Veritabanı bağlantısı ayarlanmamış" uyarısı**: `.env.local` dosyası boş
  veya yanlış yerde. Dosyayı düzelttikten sonra `npm run dev` komutunu yeniden başlatın.
- **Uzman listesi boş**: `npm run test-verisi` komutunu çalıştırdığınızdan emin olun.
- **`SEED_TEST_SIFRESI` değerini sonradan değiştirdim**: Daha önce oluşturulmuş test hesaplarının şifresi
  değişmez; eski şifre geçerli kalır.

## Ölçek modülünü açıp kapatma

`.env.local` dosyasındaki `OLCEK_MODULU_AKTIF=true` satırı ana sayfaya pasif bir "Ölçekler" düğmesi ekler.
`false` iken modül tamamen gizlidir ve site normal çalışır.
