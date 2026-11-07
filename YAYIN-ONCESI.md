# Yayın öncesi yapılacaklar

Site gerçek kullanıcılara açılmadan **önce** bu listedeki her madde tamamlanmalı.
Geliştirme ve test sürecinde bu maddeler bilerek ertelendi.

## Güvenlik

- [ ] **Test hesaplarını silin** (güvenlik denetimi, Bulgu 8).
  `test.*@example.com` hesaplarının hepsi aynı, bilinen şifreyi kullanıyor; yayında arka kapı olur.
  Supabase > **Authentication** > **Users** sayfasından silin. Silinen danışanın sohbetleri de silinir; silinen uzmanın sohbetleri danışanda 6 ay kalır.
  Yayındaki veritabanında `npm run test-verisi` komutunu **çalıştırmayın**.
- [ ] **E-posta doğrulamasını açın** (güvenlik denetimi, Bulgu 4).
  Supabase > **Authentication** > **Sign In / Providers** > **Email** > **Confirm email** seçeneğini açın.
  Bunun için kendi e-posta gönderim servisinizi (SMTP) de bağlamanız gerekir; Supabase'in ücretsiz gönderimi saatte birkaç e-postayla sınırlı.
  **Site URL** ve **Redirect URLs** ayarlarına gerçek alan adınızı yazın (şifre sıfırlama bağlantısı da buna bağlıdır).
- [ ] Admin hesabında iki adımlı doğrulamanın kurulu olduğunu kontrol edin.
- [ ] Supabase hesabınızda (panele giriş) iki adımlı doğrulamayı açın.

## Hukuk / KVKK

- [ ] KVKK aydınlatma ve açık rıza metinlerini **ve** yasal sayfaları (Kullanım Koşulları, Gizlilik, Çerez, Hakkımızda, İletişim, SSS, Öğrenci Uzmanlar) avukata onaylatın, sonra `.env` içinde `KVKK_METINLERI_ONAYLI=true` yapın. Bu tek ayar hepsindeki "Taslaktır" notunu kaldırır.
- [ ] Sitedeki bütün **[AVUKAT/KURUM ONAYI GEREKİR]** etiketlerini tek tek ele alın: metni onaylanan haliyle düzeltip etiketi kaldırın. Etiketler ayarla gizlenmez; aramak için kodda `OnayGerekir` kelimesini arayın.
- [ ] Staj modelini (süpervizyon, üniversite/kurum onayı, resmî staj sayılması) netleştirin ve `/ogrenci-uzmanlar` sayfasını güncelleyin.
- [ ] `src/lib/sabitler.ts` içindeki **örnek** iletişim e-postasını (`iletisim@example.com`) gerçek adresle değiştirin.
- [ ] Hesap silme kurallarını avukata onaylatın: açık şikayet varken silmenin engellenmesi, uzman ayrılınca sohbetin ve uzman mesajlarının 6 ay saklanması, açık rıza kayıtlarının (`consents`) hesapla birlikte silinmesi (ispat için saklanmalı mı?) ve yönetici kayıtlarının kalması.
- [ ] Metinlerdeki `[Veri sorumlusu]`, `[iletişim adresi]`, `[Saklama süreleri]` yer tutucularını doldurun.
- [ ] Yurt dışına aktarım için standart sözleşmeyi imzalayıp KVKK Kurumu'na bildirin; VERBİS kaydını kontrol edin.
- [ ] Sohbet ekranındaki acil durum numaralarını (112, 183, 114) resmi kaynaklardan yeniden doğrulayın.

## İçerik

- [ ] `src/app/layout.tsx` içindeki "Demo: gerçek bilgilerinizi girmeyin" uyarısını ve alt bilgideki öğrenci projesi notunu kaldırın.
- [ ] Site içi ödeme açılınca `src/components/OdemeUyarisi.tsx` içindeki "yakında açılacaktır" cümlesini kaldırın. Ödeme açılmadan yayına çıkılırsa uyarı, olmayan bir ödeme yöntemini anlatır.
- [ ] Görüntülü görüşme için üçüncü taraf servislere yönlendirmeyi KVKK açısından avukata sorun (Google Meet, Zoom, Microsoft Teams).
- [ ] `/psikolojik-rahatsizliklar` sayfasındaki açıklamaları lisanslı bir ruh sağlığı uzmanına kontrol ettirin.
