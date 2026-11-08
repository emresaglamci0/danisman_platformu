# Uzman bulma ölçeği: tasarım

Tarih: 2026-11-08. Yer: `src/modules/olcek/` (mevcut isteğe bağlı ölçek modülü, `OLCEK_MODULU_AKTIF`).

## Amaç ve neden

Ana sayfaya ilk kez gelen ve siteyi tanımaya çalışan danışan, kimi seçeceğini bilmeden uzun uzman listesinde kaybolabilir. Ölçek onu **sıkmadan**, yaklaşık bir dakikada, kendisine uygun uzmanlara götürür (kullanıcı kararı).

Ölçek bir tanı aracı değildir. Arka planda rahatsızlıklar ve yaşam konuları gizli üst gruplara ayrılır; danışan yalnızca "İşte sana uygun uzmanlar" sonucunu görür.

## Hedefler

- Ana sayfada, ortada açılan pop-up ile ölçeğe davet (kullanıcı kararı, seçenek A).
- Hook cümlesi (kullanıcı kararı, birebir):
  > **Nereden başlayacağını bilmiyor musun?** 1 dakikalık birkaç soruyla sana uygun uzmanları gösterelim.
- 15 maddelik kısa ölçek, tek ekranda tek madde, dokununca sonraki maddeye geçiş.
- Sonuçta uygun uzmanların iki ayrı başlık altında (bağımsız / öğrenci) gösterilmesi, her başlığın kendi açıklamasıyla (kullanıcı kararı).
- Risk maddesi işaretlenirse acil hatların uzman listesinden **önce** belirgin gösterilmesi (kullanıcı kararı).
- Rahatsızlıklar sayfasına "Oyun ve İnternet Bağımlılığı" kartının eklenmesi (kullanıcı kararı).

## Hedef olmayanlar

- Sonucu kaydetmek, panelde göstermek, tekrar görüntülemek. Sonuç yalnızca o anda görünür (kullanıcı kararı).
- Tanı, puan, yüzde veya grup adı göstermek.
- Mevcut bir ölçeği (PHQ-9, Beck vb.) kullanmak. Maddeler bu proje için yazıldı; lisans sorunu yok.
- Yeni bir uzman çalışma alanı veya veritabanı değişikliği. Siber bağımlılık mevcut `bagimlilik` alanına girer (kullanıcı kararı).

## Yapılmaması gerekenler (başarısızlık sayılır)

- Yanıtların, puanların veya seçilen grubun **tarayıcıdan çıkması**: sunucuya istek, URL parametresi, çerez, `localStorage`, log, analitik. (CLAUDE.md §3; rahatsızlıklar sayfasındaki his düğmeleriyle aynı kural.)
- Grup adlarının uzmanlara, danışanlara veya sayfa kaynağında görünür metin olarak çıkması. Kod içinde teknik anahtar olarak durabilir; ekranda hiçbir yerde yazılmaz.
- Risk maddesi, psikotik madde veya yüksek bağımlılık yanıtında öğrenci uzman gösterilmesi (kural: puanlama 6. adım).
- Modül kapalıyken ana sayfada pop-up, düğme, kırık bağlantı veya hata görünmesi.
- Sonuç ekranında "sende şu var" gibi tanı çağrıştıran ifade.

## Kısıtlar

- Tüm metinler Türkçe. Ölçek ve sonuç metinleri **taslaktır**; psikolojik içeriği proje sahibi onaylar (`YAYIN-ONCESI.md`'ye eklenir).
- Öğrenci uzmanlar için ücret/fiyat ifadesi yok; "ücretsiz, staj kapsamında" ifadesi kullanılır, staj iddiasının yanına `<OnayGerekir />`.
- Renk paleti, kontrast ve bileşenler mevcut sitedekiyle aynı (`globals.css`, `UzmanKarti`, `AcilDurumKutusu`, `acil-hatlar.ts`).
- Next.js 16 kuralları (`AGENTS.md`, `node_modules/next/dist/docs/`).

## Pop-up davranışı

- Kimler görür: giriş yapmamış ziyaretçi ve `client` rolü. `expert`, `student_expert`, `admin` görmez (kullanıcı onaylı).
- Ne zaman: sayfa açılır açılmaz değil; ana sayfada birkaç saniye geçince **veya** biraz aşağı kaydırınca, hangisi önce olursa (kullanıcı onaylı varsayım). Süre/kaydırma eşiği kurucuya bırakıldı (öneri: 8 sn veya %30 kaydırma).
- "Şimdi değil" veya ✕ ile kapatılırsa aynı tarayıcıda bir daha kendiliğinden açılmaz (kullanıcı onaylı). Bunun için `localStorage`'a **yalnızca** "pop-up gösterildi" bilgisi yazılır; yanıt veya sonuç asla yazılmaz. Erişim `try/catch` içinde olur; depolama kapalıysa pop-up yine çalışır. `/cerezler` sayfasına bu tek kayıt eklenir (kurucunun kararı: zorunlu sayılan bir arayüz tercihi, onay penceresi gerektirmez).
- Ana sayfadaki mevcut pasif "Ölçekler" düğmesinin yerini **"Sana uygun uzmanı bul"** düğmesi alır; ölçeği istendiği zaman yeniden açar (kullanıcı onaylı).
- Düğmeler: "Başlayalım" (ana renk) ve "Şimdi değil". Mevcut `<dialog>` + `showModal()` yaklaşımı korunur (klavye/odak erişilebilirliği tarayıcıdan gelir).

## Ölçek

Giriş: **"Son iki haftada…"**. Yanıtlar: *Hiç (0) · Bazen (1) · Sık sık (2) · Neredeyse her gün (3)*.

Madde 9 metni olduğu gibi kalır (kullanıcı kararı). Madde 7 ve 11'deki çift soru bilerek bırakıldı (kullanıcı kararı).

Gösterim sırası aşağıdaki sıradır; risk maddesi en sondadır.

| Sıra | Gizli grup | Madde | Alan(lar) |
|---|---|---|---|
| 1 | G1 Kaygı ve stres | Kafamdaki endişeleri durduramadım. | kaygi |
| 2 | G1 | Sorumluluklarımın altında tükenmiş hissettim. | tukenmislik |
| 3 | G1 | Uykuya dalmakta ya da uykumu sürdürmekte zorlandım. | uyku |
| 4 | G2 Duygudurum ve kayıp | Eskiden keyif aldığım şeylerden keyif alamadım. | duygudurum |
| 5 | G2 | Yaşadığım bir kayıp ya da sarsıcı bir olay aklımdan çıkmadı. | yas, travma |
| 6 | G3 İlişki ve aile | Yakınlarımla (eş, partner, aile) ilişkilerim beni yıprattı. | iliski, cift, cinsel |
| 7 | G3 | Aile içindeki sorunlar günlük hayatımı etkiledi. | aile, ebeveynlik, cocuk_ergen |
| 8 | G4 Beden ve dürtü | Yemek ya da kilom konusunda kendimi kontrol edemediğimi hissettim. | yeme |
| 9 | G4 | Bırakmak istediğim bir alışkanlığı (alkol, madde, kumar vb.) bırakamadım. | bagimlilik |
| 10 | G4 | İnternette, oyunlarda ya da sosyal medyada geçirdiğim süreyi kontrol edemedim. | bagimlilik |
| 11 | G5 Gelişim ve yaşam yönü | Dikkatimi toplamakta ya da işlerimi düzenlemekte zorlandım. | norogelisim |
| 12 | G5 | Okulum ya da kariyerimle ilgili ne yapacağımı bilemedim. | kariyer |
| 13 | G5 | Kendime güvenmekte zorlandım. | ozguven |
| 14 | Psikotik (grup değil) | Başkalarının duymadığı sesleri duydum ya da görmediği şeyleri gördüm. | psikotik |
| 15 | Risk (grup değil) | Ölmeyi ya da kendime zarar vermeyi düşündüm. | — |

Not: Konuşmadaki numaralar (1–15) burada gruplara göre yeniden sıralandı; metinler aynıdır. Alan eşlemesi (özellikle `cinsel` → madde 6) kurucunun önerisidir, proje sahibi kontrol eder.

`genel` alanı bir grup değildir, yedek eşleşmedir (kullanıcı kararı).

## Puanlama ve eşleştirme (tamamen tarayıcıda)

Saf bir fonksiyon olarak yazılır (girdi: 15 yanıt; çıktı: alan listesi, öğrenci gizli mi, risk var mı).

1. **Grup puanı** = gruptaki maddelerin ortalaması (gruplarda 2 veya 3 madde olduğu için toplam değil ortalama).
2. **Kazanan gruplar:** en yüksek ortalamalı grup; ikinci grup, ortalaması ≥ 1 ve birinciye en fazla 0,5 uzaksa o da alınır. (Eşikler kurucunun önerisi.)
3. **Eşleşen alanlar:** kazanan gruplarda **"Hiç" dışında yanıtlanan** maddelerin alanları. Böylece yalnızca bağımlılık maddelerini işaretleyen birine "yeme" alanındaki öğrenci uzman çıkmaz.
4. **Psikotik madde** "Hiç" dışındaysa `psikotik` alanı eklenir.
5. **Düşük puan:** tüm grup ortalamaları < 1 ise:
   - psikotik madde "Hiç" ise eşleşen alan `genel` olur;
   - psikotik madde "Hiç" dışındaysa eşleşen alan **yalnızca** `psikotik` olur; bu alanda uzman yoksa "Tüm bağımsız uzmanları gör" bağlantısı çıkar, `genel` yedeğine düşülmez (kurucunun kararı).
6. **Öğrenci bölümü hiç gösterilmez** (bu üç koşuldan biri yeterli):
   - risk maddesi (15) "Hiç" dışında (kullanıcı kararı: "öğrenci uzmanlar asla gözükmesin");
   - psikotik madde (14) "Hiç" dışında (kullanıcı kararı);
   - bağımlılık maddelerinden (9 veya 10) biri **yüksek**, yani "Sık sık" veya "Neredeyse her gün" (≥ 2), hangi grup kazanırsa kazansın (kullanıcı kararı: "bağımlılık maddelerinde yüksek çıkarsa öğrencilere gösterme"; "yüksek = ≥ 2" eşiği kurucunun yorumu). "Hiç" veya "Bazen" öğrencileri gizlemez.
7. **Risk:** madde 15 "Hiç" dışındaysa `risk = true`.
8. **Sıralama — eşit rekabet (kullanıcı kararı):** her bölümde uygun uzmanlar **rastgele** sıralanır, her gösterimde yeniden. Tek istisna güvenlik: psikotik madde işaretliyse `psikotik` alanındaki uzmanlar (kendi aralarında rastgele) en üstte. Eşleşen alan sayısı sıralamayı **etkilemez**; aksi halde uzman tüm alanları işaretleyerek öne geçebilirdi. Rastgelelik tarayıcıda yapılır, kaydedilmez; testte sabitlenebilmesi için dışarıdan verilebilir.

Bu fonksiyon için `scripts/olcek.test.mts` testi yazılır (projenin `node --test` düzeni). En az: bağımlılık-yalnız → `yeme` yok; madde 9 = "Sık sık" ama G1 kazanıyor → öğrenci gizli; madde 9 = "Bazen" → öğrenci görünür; psikotik işaretli → öğrenci gizli ve `psikotik` uzmanı başta; çok alan işaretleyen uzman öne geçmez; risk işaretli → `risk` ve öğrenci gizli; tümü Hiç → `genel`; psikotik işaretli + tüm ortalamalar < 1 → yalnızca `psikotik`; eşit iki grup → ikisi de alınır.

## Uzman verisi

Yanıtlar sunucuya gitmeyeceği için eşleştirme tarayıcıda yapılır. Ana sayfa (sunucu bileşeni), modül açıksa **tüm onaylı uzmanları** mevcut `onayliUzmanlar()` ile çeker ve ölçek bileşenine verir. Bu veri zaten herkese açık vitrin verisidir (`uzman_vitrini`).

`shortcut: tüm onaylı uzmanlar ana sayfaya gömülür; uzman sayısı yüzleri aşınca yalnızca kart için gerekli alanlar gönderilmeli veya sayfalı istemci sorgusu düşünülmeli.`

Modül kapalıyken bu sorgu yapılmaz.

## Sonuç ekranı

Pop-up içinde, ölçeğin yerine açılır.

1. `risk` ise en üstte `AcilDurumKutusu`, belirgin biçimde. Uzman listesi yine altında görünür (danışan yarı yolda kalmasın).
2. Başlık: **"İşte sana uygun uzmanlar"**.
3. **Bağımsız uzmanlar** başlığı ve açıklaması, en fazla 3 `UzmanKarti`.
4. **Öğrenci uzmanlar** başlığı ve açıklaması, en fazla 3 `UzmanKarti` (gizleme kuralı geçerliyse bu bölüm hiç çıkmaz).
5. Her bölümün altında "Tümünü gör" bağlantısı: `/uzmanlar?alan=<en yüksek yanıtlı maddenin alanı>&tur=independent|student`. (Mevcut `/uzmanlar` tek alan destekler. Bağlantıya tıklamak danışanın açık seçimidir; rahatsızlıklar sayfası da aynı adresi kullanıyor.)
6. Altta: "Bu bir tanı değildir; yalnızca başlangıç için bir öneridir."
7. Bir bölümde uygun uzman yoksa: o bölümde `genel` alanındaki uzmanlar; o da yoksa "Tüm uzmanları gör" bağlantısı (kullanıcı kararı).

Uzmanlar puanlama 8. adımdaki sırayla gösterilir.

## Uzman listesinde eşit rekabet

"Tümünü gör" ile açılan `/uzmanlar` sayfası da uzmanları ad sırası yerine **her istekte rastgele** sıralar (kullanıcı kararı). Karıştırma sunucuda, sayfa çizilirken yapılır. Bu değişiklik ölçek modülüne bağlı değildir; modül kapalıyken de geçerlidir. Karıştırma fonksiyonu ortak bir yardımcıdır (`src/lib/`), ölçek de aynısını kullanır.

Bölüm açıklamaları (taslak, proje sahibi düzeltir):

- **Bağımsız uzmanlar:** "Belgeleri onaylanmış psikolog ve psikolojik danışmanlar. Ücretli görüşme yaparlar; bazıları ücretsiz ön görüşme sunar."
- **Öğrenci uzmanlar:** "Son sınıf Psikoloji/PDR öğrencileri. Görüşmeleri ücretsizdir ve staj kapsamındadır." + `<OnayGerekir />`

## Rahatsızlıklar sayfası eklemesi

- `src/app/psikolojik-rahatsizliklar/veri.ts` içine yeni kart: **"Oyun ve İnternet Bağımlılığı"**, `alan: "bagimlilik"`. Kaynaklar: ICD-11 "Oyun bozukluğu" (6C51, resmi tanı); DSM-5-TR "İnternet oyun bozukluğu" (yalnızca "ileride araştırılacak durumlar" bölümünde). Metin taslaktır, proje sahibi onaylar.
- "Bırakmak istiyorum ama bırakamıyorum" his düğmesinin kartlarına bu kart eklenir. Ayrı bir "Ekrandan kopamıyorum" düğmesi eklenmez (kurucunun kararı; proje sahibi isterse eklenir).
- `scripts/rahatsizliklar.test.mts` kart sayısı veya liste kontrolü içeriyorsa güncellenir.

## Kurucunun kararları (proje sahibi kontrol etmeli)

- Madde → alan eşlemesi, özellikle `cinsel` alanının madde 6'ya bağlanması.
- Grup ortalaması, ikinci grubu alma eşiği (≥ 1 ve en fazla 0,5 fark), düşük puan eşiği (< 1).
- "Yüksek bağımlılık" = madde 9 veya 10'da ≥ 2.
- Her bölümde en fazla 3 kart.
- `localStorage`'a yalnızca "pop-up gösterildi" bilgisinin yazılması ve `/cerezler` güncellemesi.
- Ayrı "Ekrandan kopamıyorum" his düğmesinin eklenmemesi.

## Kurucuya bırakılanlar

- Pop-up gecikme süresi ve kaydırma eşiği.
- İlerleme çubuğunun görünümü, geri dönme düğmesi olup olmayacağı (öneri: "Geri" bağlantısı olsun).
- Dosya yapısı `src/modules/olcek/` içinde; puanlama mantığı ayrı, test edilebilir bir `.ts` dosyasında.
