# Yayın öncesi yapılacaklar

Site gerçek kullanıcılara açılmadan **önce** bu listedeki her madde tamamlanmalı.
Geliştirme ve test sürecinde bu maddeler bilerek ertelendi.

## Güvenlik

- [ ] **Test hesaplarını silin** (güvenlik denetimi, Bulgu 8).
  `test.*@example.com` hesaplarının hepsi aynı, bilinen şifreyi kullanıyor; yayında arka kapı olur.
  Supabase > **Authentication** > **Users** sayfasından silin. Silinen danışanın sohbetleri de silinir; silinen uzmanın sohbetleri danışanda 6 ay kalır.
  Yayındaki veritabanında `npm run test-verisi` komutunu **çalıştırmayın**.
- [ ] Uzman puanlama: ödeme demo olduğu için iki sahte seansla puan verilebilir. Gerçek ödemeyle birlikte puan şartı yeniden değerlendirilmeli.
- [ ] **E-posta doğrulamasını açın** (güvenlik denetimi, Bulgu 4).
  Supabase > **Authentication** > **Sign In / Providers** > **Email** > **Confirm email** seçeneğini açın.
  Bunun için kendi e-posta gönderim servisinizi (SMTP) de bağlamanız gerekir; Supabase'in ücretsiz gönderimi saatte birkaç e-postayla sınırlı.
  **Site URL** ve **Redirect URLs** ayarlarına gerçek alan adınızı yazın (şifre sıfırlama bağlantısı da buna bağlıdır).
- [ ] Admin hesabında iki adımlı doğrulamanın kurulu olduğunu kontrol edin.
- [ ] Supabase hesabınızda (panele giriş) iki adımlı doğrulamayı açın.

## Hukuk / KVKK

- [ ] KVKK aydınlatma ve açık rıza metinlerini **ve** yasal sayfaları (Kullanım Koşulları, Gizlilik, Çerez, Hakkımızda, İletişim, SSS, Öğrenci Uzmanlar) avukata onaylatın, sonra `.env` içinde `KVKK_METINLERI_ONAYLI=true` yapın. Bu tek ayar hepsindeki "Taslaktır" notunu kaldırır.
- [ ] Sitedeki bütün **[AVUKAT/KURUM ONAYI GEREKİR]** etiketlerini tek tek ele alın: metni onaylanan haliyle düzeltip etiketi kaldırın. Etiketler ayarla gizlenmez; aramak için kodda `OnayGerekir` kelimesini arayın.
- [ ] Staj modelini (süpervizyon, üniversite/kurum onayı, resmî staj sayılması) netleştirin ve `/ogrenci-uzmanlar/hakkinda` sayfasını güncelleyin.
- [ ] **PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencilerinin** staj kapsamında görüşme yapabilmesini avukat/kurum ile doğrulayın.
- [ ] **Ciddi durum sorusunu KVKK metnine ekleyin.** Öğrenci uzman başvurusunda sorulur, yanıt kaydedilmez. Metin değişirse `KVKK_SURUMU` değişmeli.
- [ ] **Ciddi durum listesini klinik açıdan onaylayın.** Liste `/psikolojik-rahatsizliklar` verisindeki `agir: true` kartlardır (şu an 8 durum).
- [ ] `src/lib/sabitler.ts` içindeki **örnek** iletişim e-postasını (`iletisim@example.com`) gerçek adresle değiştirin.
- [ ] Hesap silme kurallarını avukata onaylatın: açık şikayet varken silmenin engellenmesi, uzman ayrılınca sohbetin ve uzman mesajlarının 6 ay saklanması, açık rıza kayıtlarının (`consents`) hesapla birlikte silinmesi (ispat için saklanmalı mı?) ve yönetici kayıtlarının kalması.
- [ ] Metinlerdeki `[Veri sorumlusu]`, `[iletişim adresi]`, `[Saklama süreleri]` yer tutucularını doldurun.
- [ ] Yurt dışına aktarım için standart sözleşmeyi imzalayıp KVKK Kurumu'na bildirin; VERBİS kaydını kontrol edin.
- [ ] Sohbet ekranındaki acil durum numaralarını (112, 183, 114) resmi kaynaklardan yeniden doğrulayın.
- [ ] **Rahatsızlık metinlerini onaylayın.** /psikolojik-rahatsizliklar sayfasındaki açıklama, belirti, yaygınlık ve kaynakları proje sahibi okuyup onaylamalı.
- [ ] **Ölçek metinlerini onaylayın.** src/modules/olcek/maddeler.ts içindeki 15 madde, sonuç ekranı açıklamaları ve "Oyun ve İnternet Bağımlılığı" kartı proje sahibi tarafından onaylanmalı.

## İçerik

- [ ] `src/app/layout.tsx` ve `src/app/global-error.tsx` içindeki "Demo: gerçek bilgilerinizi girmeyin" uyarısını ve alt bilgideki öğrenci projesi notunu kaldırın.
- [ ] **Demo ödemeyi değiştirin veya kapatın.** `src/modules/odeme/` şu an demodur: para çekilmez. Yayında ya Türkiye'de lisanslı, alt üye işyeri / pazaryeri desteği olan bir ödeme kuruluşu bağlanmalı (kart bilgisi sunucumuza gelmemeli, CSP'ye yalnızca o adres eklenmeli) ya da `ODEME_MODULU_AKTIF=false` yapılmalı. Gerçek ödemede kayıtların yasal saklama süresi ayrıca belirlenmeli; şu an seans kayıtları sohbetle birlikte silinir.
- [ ] İptal, iade ve 48 saatlik bekletme kurallarını ve yöneticinin iade kararını avukata onaylatın.
- [ ] Bağımsız uzman mesajlarındaki otomatik IBAN ve telefon kontrolünü avukata onaylatın. Yanlış alarm oranına bakın; `src/lib/seans-kurallari.ts` içindeki kalıplar yalnızca düz yazılmış numarayı yakalar.
- [ ] Görüntülü görüşme için üçüncü taraf servislere yönlendirmeyi KVKK açısından avukata sorun (Google Meet, Zoom, Microsoft Teams).
- [ ] `/psikolojik-rahatsizliklar` sayfasındaki açıklamaları lisanslı bir ruh sağlığı uzmanına kontrol ettirin.
