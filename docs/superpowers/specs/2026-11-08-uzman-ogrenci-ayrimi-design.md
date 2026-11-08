# Uzmanlar ve Öğrenci Uzmanların Ayrılması: Tasarım

Tarih: 2026-11-08

## Amaç

Bağımsız uzmanlar ile öğrenci uzmanların misyonu farklıdır. Uzmanlar ücretli seans verir. Öğrenci uzmanlar staj kapsamında ücretsiz görüşür. İkisi aynı listede durduğunda öğrenciler öne çıkamıyor ve sitede bulunmalarının anlamı kalmıyor. Ücretsiz bir görüşme isteyen, hafif bir sorunu olan kişi **tek tıkta** öğrenci uzmanlara ulaşabilmeli.

Aynı çalışmada kabul kuralları da değişiyor.

## Hedefler

1. Uzmanlar ve Öğrenci Uzmanlar ayrı sayfalarda listelenir, hiçbir listede karışmaz.
2. Her grup kendi içinde sınıflanır: Uzmanlar unvana, öğrenciler bölüme göre.
3. Menüden ve ana sayfadan öğrencilere tek tıkla ulaşılır.
4. Yalnızca iki unvan ve iki öğrenci grubu kabul edilir.
5. Ciddi durumu olan danışan öğrenci uzmana başvuramaz.

## Kapsam dışı

- Ayrı profil adresi: profiller `/uzmanlar/[id]` adresinde kalır.
- Eski `/uzmanlar?tur=student` adresi için yönlendirme: site içi bütün bağlantılar güncellenir, dışarıdan gelen bağlantı yok.
- Kayıt formunda yeni adım: form aynı kalır, seçenekler değişir.
- Sıralama kurallarında değişiklik: `puanaGoreSirala` aynen kullanılır.
- KVKK metnine ekleme: proje sahibi daha sonra yapacak (`YAYIN-ONCESI.md`).

## Kabul edilmeyecek sonuçlar

- Öğrenci uzmanın ücretli uzmanlarla aynı listede görünmesi.
- Danışanın sağlık durumunun kaydedilmesi, loglanması veya uzmana gösterilmesi.
- Eski bir Psikoloji lisans öğrencisinin yüksek lisans öğrencisi gibi görünmesi.
- Staj veya kabul kurallarıyla ilgili bir iddianın `<OnayGerekir />` olmadan kesin bilgi gibi yazılması.

## Kullanıcı kararları (2026-11-08)

### Unvanlar ve öğrenci grupları

- Uzman unvanları yalnızca **Psikolog** ve **Psikolojik Danışman**.
- `klinik_psikolog` kaydı `psikolog`, `uzman_psikolojik_danisman` kaydı `psikolojik_danisman` olur.
- Öğrenciler: **PDR 4. sınıf** veya **Klinik Psikoloji yüksek lisans** (her sınıf), öğrenci belgesiyle.
- Psikoloji lisans öğrencileri artık kabul edilmez. Mevcut hesaplar kalıcı olarak **silinir** (kullanıcı kararı).

### Sayfa düzeni (A düzeni)

- `/uzmanlar`: yalnızca bağımsız uzmanlar. "Tümü / Uzmanlar / Stajyer" filtresi kalkar. Yerine unvan filtresi gelir: Tümü, Psikolog, Psikolojik Danışman.
- `/ogrenci-uzmanlar`: yalnızca öğrenci uzmanlar. Bölüm filtresi: Tümü, PDR 4. sınıf, Klinik Psikoloji Yüksek Lisans.
- İki sayfada da konu filtresi ve isimle arama kalır. Öğrenci sayfasının konu filtresinde `OGRENCIYE_KAPALI_ALANLAR` görünmez.
- Mevcut bilgi sayfası `/ogrenci-uzmanlar/hakkinda` adresine taşınır.
- Üst menüde "Uzmanlar"ın yanına vurgulu "Öğrenci Uzmanlar · Ücretsiz" bağlantısı eklenir.
- Ana sayfada iki kapı yan yana durur: Uzmanlar (ücretli seans) ve Öğrenci Uzmanlar (ücretsiz görüşme).
- Profil sayfasındaki geri bağlantısı kişinin kendi listesine gider.

### Ciddi durum sorusu

- Yalnızca öğrenci uzmana başvuruda sorulur. Zorunlu tek soru: "Şu durumlardan biri için mi görüşmek istiyorsunuz?"
- Liste, `src/app/psikolojik-rahatsizliklar/veri.ts` içinde `agir: true` olan kartların adlarından oluşur. Şu an: Anoreksiya, Bulimiya, Bipolar Bozukluk, Kumar Bozukluğu, Madde Kullanımı Bozukluğu, Narkolepsi, Oyun ve İnternet Bağımlılığı, Şizofreni. Ayrı bir liste tutulmaz.
- "Evet" denirse başvuru tarayıcıda durur, sunucuya istek gitmez, `/uzmanlar` sayfasına bağlantı gösterilir.
- "Hayır" denirse başvuru normal sürer. Yanıt **hiçbir yere kaydedilmez**.
- Danışanın beyanına güvenilir; site bunu doğrulayamaz.
- Mevcut isteğe bağlı "Konu" alanı aynen kalır.

### Psikolojik Rahatsızlıklar kartları

- `agir: false` kartlarda iki bağlantı: Uzmanlar ve Öğrenci Uzmanlar (ikisi de `?alan=...` ile).
- `agir: true` kartlarda yalnızca Uzmanlar bağlantısı.

### Ölçek sonuçları

- Bağımsız öneri `/uzmanlar`, öğrenci önerisi `/ogrenci-uzmanlar` adresine gider. Risk kuralları değişmez.

### Metinler

"Son sınıf Psikoloji/PDR" geçen her yer yeni kurala göre yazılır. Staj iddialarının yanındaki `<OnayGerekir />` kalır. Yasal metin değiştiği için `YASAL_METIN_TARIHI` güncellenir.

Değişecek yerler: `src/app/page.tsx`, `src/app/hakkimizda/page.tsx`, `src/app/sss/page.tsx`, `src/app/ogrenci-uzmanlar/page.tsx` (taşınan metin), `src/app/kayit/KayitFormu.tsx`, `src/app/kayit/islemler.ts`, `src/app/uzmanlar/[id]/page.tsx`, `src/app/on-gorusme/page.tsx`, `src/modules/olcek/OlcekPenceresi.tsx`, `scripts/test-verisi.mts`, `CLAUDE.md`.

## Teknik kararlar (uygulayıcının çağrısı olarak önerildi)

### Veritabanı: `supabase/migrations/0021_uzman_ogrenci_ayrimi.sql`

Migration'dan **önce** eski hesaplar silinir (aşağıdaki betik). Migration sırası:

1. `department = 'psikoloji'` satırı kaldıysa `ESKI_PSIKOLOJI_HESAPLARI_SILINMEDI` hatasıyla dur.
2. Eski unvanları dönüştür: `klinik_psikolog` → `psikolog`, `uzman_psikolojik_danisman` → `psikolojik_danisman`.
3. `title` kısıtını `('psikolog', 'psikolojik_danisman')` olarak değiştir.
4. `department` kısıtını `('pdr', 'klinik_psikoloji_yl')` olarak değiştir.

`handle_new_user` değişmez. `final_year` meta alanı aynı kalır; kayıt sunucu işlemi yeni bölümleri kabul eder ve onay kutusunun metni iki grubu birlikte anar.

### Eski hesapların silinmesi: `scripts/eski-psikoloji-hesaplarini-sil.mts`

Silme SQL ile yapılmaz, çünkü SQL depodaki dosyaları temizleyemez ve kimlik belgeleri sahipsiz kalırdı. Betik `src/app/panel/hesap-islemleri.ts` ile aynı sırayı izler ve aynı kuralları korur:

1. `kind = 'student'` ve `department = 'psikoloji'` hesapları bulur.
2. `--onay` bayrağı yoksa yalnızca sayıyı yazar, hiçbir şey silmez.
3. Sohbetinde açık şikayet veya inceleme olan hesabı **atlar** ve sayısını bildirir; kanıt yok edilmez. Bu hesap kaldığı sürece migration çalışmaz; önce inceleme sonuçlandırılır.
4. Önce `uzman-belgeleri` ve `profil-fotograflari` dosyalarını, sonra hesabı siler (`auth.admin.deleteUser`). Dosya silinemezse hesaba dokunmaz.
5. Çıktıya ad veya e-posta yazmaz, yalnızca sayı yazar.

Sohbet davranışı normal uzman silme ile aynıdır (0013): sohbet danışanda 6 ay salt okunur kalır. Silme geri alınamaz.

Bu toplu işlem bir yönetici kararı olmadığı için `admin_audit_log` kaydı yazılmaz.

Elle kontrol için `supabase/denetim/0021_denetim.sql` önceki denetim dosyalarının kalıbıyla eklenir.

### Kod

- `src/lib/sabitler.ts`: `UNVANLAR` iki değere iner. `BOLUMLER` şu olur: `pdr: "PDR 4. sınıf"`, `klinik_psikoloji_yl: "Klinik Psikoloji Yüksek Lisans"`.
- `src/lib/uzmanlar.ts`: `onayliUzmanlar` filtresine `unvan` ve `bolum` eklenir. `uzmanUnvani` çıktısı `Stajyer · {BOLUM}` olur, "son sınıf" eki kalkar.
- Liste sayfası ortak bir parçaya taşınır, iki sayfa bu parçayı kendi filtreleriyle kullanır. Hata ve boş durum davranışı korunur.
- `src/app/uzmanlar/[id]/BasvuruFormu.tsx`: öğrenci başvurusuna soru eklenir. Durum adları sunucu bileşeninden prop olarak gelir.
- `src/app/uzmanlar/[id]/islemler.ts`: `basvuruYap` öğrenci uzman için `ciddiDurum === "hayir"` ister. Yanıt yazılmaz, loglanmaz.
- `src/app/psikolojik-rahatsizliklar/kurallar.ts`: `uzmanBaglantisi` yerine iki adres döndüren bir fonksiyon gelir. `scripts/rahatsizliklar.test.mts` güncellenir.
- Yasal sayfa bağlantıları `/ogrenci-uzmanlar/hakkinda` olur: `src/app/layout.tsx`, `src/app/hakkimizda/page.tsx`, `src/app/kullanim-kosullari/page.tsx`, `src/app/sss/page.tsx`, `src/app/kayit/KayitFormu.tsx`, `src/app/uzmanlar/[id]/page.tsx`.
- `src/app/on-gorusme/page.tsx:90` ve `src/modules/olcek/OlcekPenceresi.tsx:131,139`: yeni adresler.
- `scripts/test-verisi.mts`: `klinik_psikolog`, `uzman_psikolojik_danisman` ve `psikoloji` örnekleri yeni değerlere çevrilir.

### Testler

`scripts/*.test.mts` kalıbıyla: unvan ve bölüm listeleri, rahatsızlık kartı bağlantıları, ciddi durum kontrolü, eski hesap ayırma kuralı. Var olan testler geçmeli.

### Proje dosyaları

- `CLAUDE.md`: öğrenci kabul kuralı ve bu ayrım yazılır.
- `YAYIN-ONCESI.md`: ciddi durum sorusunun KVKK metnine eklenmesi, 8 durumun klinik kontrolü, yeni öğrenci gruplarının staj kapsamında hizmet verebilmesinin avukat/kurum onayı.

## Bilinen sınırlar

- Ciddi durum sorusu danışanın beyanına dayanır. Yanıt saklanmadığı için veritabanı bu kuralı zorlayamaz; kontrol sunucu işlemindedir.
- Betiği ve migration'ı proje sahibi elle çalıştırır: önce betik, sonra migration, sonra `npm run test-verisi`. Kod migration'dan önce yayına alınırsa yeni bölüm kaydı kısıta takılır.
