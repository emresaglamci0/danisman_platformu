# Yayın öncesi yapılacaklar

Site gerçek kullanıcılara açılmadan **önce** bu listedeki her madde tamamlanmalı.
Geliştirme ve test sürecinde bu maddeler bilerek ertelendi.

## Güvenlik

- [ ] **Test hesaplarını silin** (güvenlik denetimi, Bulgu 8).
  `test.*@example.com` hesaplarının hepsi aynı, bilinen şifreyi kullanıyor; yayında arka kapı olur.
  Supabase > **Authentication** > **Users** sayfasından silin. Silinen kullanıcının profili, başvuruları ve sohbetleri de silinir.
  Yayındaki veritabanında `npm run test-verisi` komutunu **çalıştırmayın**.
- [ ] **E-posta doğrulamasını açın** (güvenlik denetimi, Bulgu 4).
  Supabase > **Authentication** > **Sign In / Providers** > **Email** > **Confirm email** seçeneğini açın.
  Bunun için kendi e-posta gönderim servisinizi (SMTP) de bağlamanız gerekir; Supabase'in ücretsiz gönderimi saatte birkaç e-postayla sınırlı.
  **Site URL** ve **Redirect URLs** ayarlarına gerçek alan adınızı yazın.
- [ ] Admin hesabında iki adımlı doğrulamanın kurulu olduğunu kontrol edin.
- [ ] Supabase hesabınızda (panele giriş) iki adımlı doğrulamayı açın.

## Hukuk / KVKK

- [ ] KVKK aydınlatma ve açık rıza metinlerini avukata onaylatın, sonra `.env` içinde `KVKK_METINLERI_ONAYLI=true` yapın.
- [ ] Metinlerdeki `[Veri sorumlusu]`, `[iletişim adresi]`, `[Saklama süreleri]` yer tutucularını doldurun.
- [ ] Yurt dışına aktarım için standart sözleşmeyi imzalayıp KVKK Kurumu'na bildirin; VERBİS kaydını kontrol edin.
- [ ] Sohbet ekranındaki acil durum numaralarını (112, 183, 114) resmi kaynaklardan yeniden doğrulayın.
