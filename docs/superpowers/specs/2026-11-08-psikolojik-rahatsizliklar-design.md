# Psikolojik Rahatsızlıklar sayfası: tasarım

Tarih: 2026-11-08. Sayfa: `/psikolojik-rahatsizliklar` (`src/app/psikolojik-rahatsizliklar/`).

## Amaç ve neden

Sayfa iki kişiye hizmet eder:

1. **İçinde bir sıkıntı olan ama adını koyamayan kişi.** Rahatsızlık adlarını bilmez, ne hissettiğini bilir. Sayfaya hislerinden girip kendine yakın rahatsızlıkları görmeli, sonra o alanda çalışan bir uzmana ulaşmalı (kullanıcı kararı).
2. **Genç araştırmacı / psikoloji meraklısı.** İki cümlelik açıklama yetmez; belirtiler, yaygınlık, nedenler, tedavi ve kaynak görmek ister.

Bugün sayfa 19 rahatsızlığı alfabetik, açılır kartlarla gösteriyor; yalnızca kaygı grubundaki 5 kart bir uzman alanına bağlı, gerisi tüm uzman listesine gidiyor.

## Hedefler

- His düğmeleriyle ("Neler yaşıyorsun?") sayfaya girilebilmesi.
- Her kartın, ilgili uzman alanına giden bir düğmesi olması.
- Ağır rahatsızlıkların **asla öğrenci uzmanlara yönlendirilmemesi**.
- Kart açılınca meraklı okuyucu için ayrıntılı bölüm.
- 7 yeni rahatsızlık, 4 genel + 8 rahatsızlık grubu olmak üzere 12 yeni uzman çalışma alanı.

## Hedef olmayanlar

- Psikiyatriste yönlendirme. Bu uzmanın işidir; acil hatlar zaten her sayfada var (kullanıcı kararı).
- Her rahatsızlık için ayrı sayfa (seçenek B reddedildi).
- Serbest metin arama ve grup başlıklı yerleşim (seçenek B ve C seçilmedi).
- Uzman listesinde filtreyi kilitlemek: ziyaretçi listeye vardıktan sonra filtreyi kendisi "öğrenci" yaparsa engellenmez. Kural sitenin kendi bağlantılarıyla sağlanır (kullanıcı kararı).

## Yapılmaması gerekenler (başarısızlık sayılır)

- Sayfa "sende şu var" demez, puan/test sonucu üretmez. His düğmeleri yalnızca kartları öne çıkarır. Bilgilendirme notu ("tanı yerine geçmez") kalır.
- Seçilen his düğmeleri **tarayıcıdan çıkmaz**: sunucuya, adres çubuğuna (URL parametresi), log'a veya analitiğe yazılmaz (CLAUDE.md §3, hassas veri).
- Kaynakta bulunamayan rakam uydurulmaz.
- Ağır bir karttan öğrenci uzman listesine giden bağlantı olmaz.

## Kararlar

### Uzman çalışma alanları (`ALANLAR`, `src/lib/sabitler.ts`)

Mevcut 7 alan kalır. Eklenecekler (kullanıcı kararı):

- Genel: Çift ve evlilik, Çocuk ve ergen, Ebeveynlik, Tükenmişlik ve iş stresi.
- Rahatsızlık grupları: Depresyon ve duygudurum, Travma, Yeme ve beden algısı, Bağımlılık, Uyku sorunları, Cinsel sorunlar, Nörogelişim, Psikotik bozukluklar.

Anahtar adları (ör. `cift`, `cocuk_ergen`, `ebeveynlik`, `tukenmislik`, `duygudurum`, `travma`, `yeme`, `bagimlilik`, `uyku`, `cinsel`, `norogelisim`, `psikotik`) yapıcıya kalmıştır.

`specialties text[]` sütununda kısıt yok; uzman profili, uzman kartı ve filtre `ALANLAR`'dan okuduğu için kendiliğinden genişler. Uzman paneli sunucuda `listedeMi(ALANLAR, …)` ile doğrular.

**Veritabanı:** başvuru (`0001`, `topic` check) ve grup seansı (`0018`, `topic` check) konu listeleri yeni alanların hepsini kabul edecek şekilde yeni bir migration ile genişletilir (`0019_...`). Grup seansında tüm alanlar konu olabilir, ağırlar dahil (kullanıcı kararı; grup seansı zaten yalnızca bağımsız uzmanın).

### Kart → alan eşleşmesi (kullanıcı onaylı)

`*` = ağır (yalnızca bağımsız uzmanlar).

| Alan | Kartlar |
|---|---|
| Kaygı ve stres (mevcut) | Anksiyete, Hastalık Kaygısı, OKB, Özgül Fobi, Panik Bozukluk, Sosyal Kaygı Bozukluğu, Agorafobi |
| Depresyon ve duygudurum | Depresyon, Bipolar Bozukluk*, Kalıcı Depresif Bozukluk, Doğum Sonrası Depresyon |
| Travma | Travma Sonrası Stres Bozukluğu, Uyum Bozukluğu |
| Yeme ve beden algısı | Anoreksiya*, Bulimiya*, Tıkınırcasına Yeme Bozukluğu, Beden Disformik Bozukluğu |
| Bağımlılık | Madde Kullanımı Bozukluğu*, Kumar Bozukluğu* |
| Uyku sorunları | İnsomni, Narkolepsi* |
| Cinsel sorunlar | Cinsel Bozukluklar |
| Nörogelişim | DEHB, Otizm Spektrum Bozukluğu, Disleksi |
| Psikotik bozukluklar | Şizofreni* |

Ağır liste: Şizofreni, Bipolar, Anoreksiya, Bulimiya, Madde Kullanımı, Narkolepsi, Kumar (kullanıcı onaylı).

Her kartın bir alanı olur; artık alansız kart yoktur.

### Öğrenci uzmanlara kapalı alanlar (kullanıcı kararı)

Tamamı ağır olan iki alan, **Psikotik bozukluklar** ve **Bağımlılık**, öğrenci uzmanlara kapalıdır:

- Öğrenci uzman bu alanları panelde göremez ve seçemez (`ProfilFormu.tsx`); sunucu da reddeder (`panel/islemler.ts`).
- Danışan öğrenci uzmana başvururken bu konuları göremez ve seçemez (`uzmanlar/[id]/BasvuruFormu.tsx`); sunucu da reddeder (`uzmanlar/[id]/islemler.ts`).
- 0019 migration'ı aynı kuralı veritabanında da uygular (öğrenci uzmanın `specialties` dizisinde ve öğrenci uzmana yapılan başvurunun `topic` alanında bu iki değer olamaz; trigger veya check, yapıcıya kalmıştır).
- Karışık alanlar (Depresyon ve duygudurum, Yeme ve beden algısı, Uyku sorunları) öğrencilere açıktır; içlerindeki ağır kartlar zaten `tur=independent` ile bağlanır.
- Kapalı alan listesi tek yerde tutulur (ör. `sabitler.ts` içinde `OGRENCIYE_KAPALI_ALANLAR`).

### Kart düğmesi

- Yazı: **"Bu alanda çalışan uzmanları gör"** (kullanıcı kararı).
- Görünüm: dolgulu ana renk düğme (`bg-teal-700`, beyaz yazı), metin bağlantısı değil (kullanıcı kararı).
- Hedef: normal kart `/uzmanlar?alan=<alan>`; ağır kart `/uzmanlar?alan=<alan>&tur=independent`. `/uzmanlar` iki parametreyi de zaten destekliyor.

### Boş uzman listesi

Düğme, alanda uzman olsun olmasın her açık kartta görünür (kapalı kartta görünmez; açık kart içeriğinin 4. adımıdır, kullanıcının seçtiği önizlemedeki gibi). Alanda uzman yoksa `/uzmanlar` "Bu alanda henüz uzman yok" yazısı ve tüm uzmanlara (ağır kartta: tüm bağımsız uzmanlara) giden bağlantı gösterir (kullanıcı kararı). Bugünkü boş durum mesajı buna göre düzenlenir. `/uzmanlar` ağır karttan gelindiğini ayrıca bilmez; `tur=independent` varsa yedek bağlantı tüm bağımsız uzmanlara gider, elle "Bağımsız" seçen ziyaretçi için de bu doğrudur, yeni parametre gerekmez (Claude'un kararı).

### His düğmeleri (seçenek A, kullanıcı kararı)

- Sayfa başında "Neler yaşıyorsun? (birden fazla seçebilirsin)" başlığı altında sade dilde düğmeler.
- Seçili düğme dolgulu ve ✓ içerir (yalnızca renge güvenilmez); `aria-pressed` kullanılır.
- Hiç seçim yokken tüm kartlar normal. Seçim varsa, seçili hislerden **en az birine** bağlı kartlar normal kalır, diğerleri soluklaşır (gizlenmez, tıklanabilir kalır). Bir "Seçimi temizle" düğmesi olur.
- Durum yalnızca bileşen içinde (`useState`) tutulur; URL'ye, `localStorage`'a, sunucuya yazılmaz.
- His listesi ve her hissin hangi kartlara bağlandığı içerik verisinin parçasıdır. Önizlemedeki örnekler: "Sürekli endişeleniyorum", "Uyuyamıyorum", "Hiçbir şeyden keyif almıyorum", "Yemekle ilişkim bozuldu", "Aklımdan atamadığım düşünceler", "Yaşadığım bir olayı unutamıyorum". Tam liste (yaklaşık 12-16 his) ve eşleşmeler içerik taslağıyla birlikte yazılır; kullanıcı kontrol eder. Bir his hem ağır hem normal kartlara bağlanabilir (ör. "Uyuyamıyorum": İnsomni ve Narkolepsi); his düğmeleri bir yere bağlantı vermez, yalnızca kart öne çıkarır, ağır kural kartın kendi düğmesinde uygulanır (Claude'un kararı).

### Açık kart içeriği (seçenek A, kullanıcı kararı)

Kart açılınca, sırasıyla:

1. Kısa açıklama (bugünkü metin, gerekirse düzeltilmiş).
2. "Neler hissedilebilir?" sade dilde 3-5 maddelik belirti listesi.
3. "Daha fazla" açılır bölümü: Ne kadar yaygın? · Neden ortaya çıkar? · Nasıl tedavi edilir? · Kaynaklar.
4. "Bu alanda çalışan uzmanları gör" düğmesi.

"Daha fazla" için mevcut `AcilirKutu` bileşeni veya `<details>` kullanılabilir; yapıcıya kalmıştır.

### İçerik ve doğruluk

- 26 kartın metinlerini Claude taslak olarak yazar. Kaynaklar: DSM-5-TR, Dünya Sağlık Örgütü (ICD-11, bilgi sayfaları), NIMH. Yaygınlık rakamı yalnızca kaynakta bulunursa yazılır, hangi kaynaktan ve hangi ülke/dünya için olduğu belirtilir; bulunamazsa o satır yazılmaz.
- Kullanıcının alanı psikolojidir; metinleri o okur ve düzeltir. Onayından sonra metin "uzman kontrolünden geçmiş" sayılır, "taslak" notu gerekmez. Onaydan önce kod birleştirilebilir ama kullanıcıya metin onayı ayrıca hatırlatılır. Onaydan önce sayfada ek bir "taslak" notu veya yeni bir ayar olmaz; mevcut "tanı yerine geçmez" notu ve her sayfadaki demo uyarısı yeterli sayılır. Bunun yerine `YAYIN-ONCESI.md` dosyasına "Rahatsızlık metinleri ve kaynakları proje sahibi tarafından okunup onaylanmalı" maddesi eklenir (Claude'un kararı).
- Kaynaklar kartta ad + bağlantı olarak verilir. Dış bağlantılar `rel="noopener noreferrer"` ile yeni sekmede açılır.

### Veri yapısı

İçerik, sayfa bileşeninden ayrı bir veri dosyasına taşınır (ör. `src/app/psikolojik-rahatsizliklar/veri.ts`): her rahatsızlık için `ad`, `alan`, `agir`, `aciklama`, `belirtiler`, `yayginlik?`, `nedenler`, `tedavi`, `kaynaklar`; ayrıca his listesi ve her hissin bağlı olduğu kart adları. Sıralama bugünkü gibi Türkçe alfabetik.

## Sınırlar

- Next.js 16: kod yazmadan önce `AGENTS.md` ve `node_modules/next/dist/docs/`.
- Türkçe arayüz, "Adaçayı ve Kum" paleti, kontrast ≥ 4.5, Lora başlıklar (CLAUDE.md §6).
- Ölçek modülüne bağımlılık yok; sayfa ölçek modülü kapalıyken eksiksiz çalışır.
- Test verisi (`scripts/test-verisi.mts`) yeni alanlardan birkaçını kullanacak şekilde güncellenir ki filtreler denenebilsin.

## Yapıcıya kalanlar

- Alan anahtar adları, his düğmelerinin tam düzeni, soluklaştırma stili, `/uzmanlar` filtre düğmelerinin 19 alana çıkınca nasıl sığacağı (ör. sarmalanan satırlar).
- Migration'ın check kısıtlarını nasıl değiştireceği (`drop constraint` + yeni `check`).
