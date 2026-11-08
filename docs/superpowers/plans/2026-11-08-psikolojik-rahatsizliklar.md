# Psikolojik Rahatsızlıklar Sayfası Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/psikolojik-rahatsizliklar` sayfasına his düğmeleri, animasyonlu psikolog çizimi, ayrıntılı kart içeriği ve doğru uzman alanına giden düğmeler eklemek; uzman alanlarını 12 yeni başlıkla genişletmek ve iki ağır alanı öğrenci uzmanlara kapatmak.

**Architecture:** Alan listesi `src/lib/sabitler.ts` içinde tek yerde kalır; öğrenciye kapalı alan kuralı saf bir fonksiyonla hem formlarda hem sunucuda, ayrıca 0019 migration'ındaki trigger'larla veritabanında uygulanır. Rahatsızlık içeriği ayrı bir veri dosyasına taşınır; his seçimi yalnızca istemci bileşeninin state'inde durur.

**Tech Stack:** Next.js 16 (App Router, server actions), TypeScript, Tailwind 4, Supabase (Postgres, RLS), `node --test` (`npm test`).

**Spec:** `docs/superpowers/specs/2026-11-08-psikolojik-rahatsizliklar-design.md`

## Global Constraints

- Kod yazmadan önce `AGENTS.md` ve `node_modules/next/dist/docs/` okunur (Next.js 16 farkları).
- Tüm arayüz metni Türkçe. Palet "Adaçayı ve Kum"; düğme `bg-teal-700` + beyaz yazı; kontrast ≥ 4.5; form kenarlığı `slate-300`.
- Seçili his düğmeleri tarayıcıdan çıkmaz: URL, `localStorage`, sunucu, log, analitik yok.
- Sayfa "sende şu var" demez; "tanı yerine geçmez" notu kalır.
- Kaynakta bulunmayan yaygınlık rakamı yazılmaz.
- Ağır kartlar (Şizofreni, Bipolar Bozukluk, Anoreksiya, Bulimiya, Madde Kullanımı Bozukluğu, Narkolepsi, Kumar Bozukluğu) yalnızca `tur=independent` ile bağlanır.
- Öğrenciye kapalı alanlar: Psikotik bozukluklar, Bağımlılık.
- Düğme yazısı aynen: **"Bu alanda çalışan uzmanları gör"**.
- Hareket: `prefers-reduced-motion: reduce` altında tüm animasyon durur.
- Migration'lar tekrar çalıştırılınca hata vermez (`if exists` / `create or replace`), dosya başında Türkçe (ASCII) açıklama ve çalıştırma sırası yazılır, mevcut dosyalar gibi.
- Her görevin sonunda: `npm test`, `npm run lint`, `npx tsc --noEmit` temiz.

## Review Focus

1. **Öğrenci uzmanın profilinde zaten kapalı alan varsa** (örn. elle veritabanına yazılmış): panel kaydı, kapalı alanı sessizce düşürmeli, hata vermemeli; trigger yalnızca yeni yazımı engeller. → Görev 3'te `alanlariSuz` testi.
2. **Danışan formu atlayıp öğrenci uzmana `konu=psikotik` gönderirse**: sunucu Türkçe hata dönmeli, veritabanı da reddetmeli. → Görev 2 denetim SQL'i ve Görev 3 sunucu kontrolü.
3. **Hiç his seçilmemişken** hiçbir kart soluk olmamalı; **seçim temizlenince** ampul soru işaretine dönmeli. → Görev 5'te `oneCikanKartlar` testi (boş küme durumu).
4. **Bir his, adı veride olmayan bir karta bağlanırsa** (yazım hatası) sessizce hiçbir şey öne çıkmaz. → Görev 4'te veri bütünlüğü testi.
5. **`/uzmanlar?alan=<bilinmeyen>`** gibi eski/bozuk bağlantı: mevcut `listedeMi` filtresi alanı yok sayar; boş durum mesajı yine doğru bağlantıyı göstermeli. → Görev 7'de elle kontrol adımı.

---

### Task 1: Alan sabitleri ve öğrenci kuralı

**Files:**
- Modify: `src/lib/sabitler.ts:62-71`
- Test: `scripts/alanlar.test.mts`

**Interfaces:**
- Produces:
  - `ALANLAR` 19 anahtar: mevcut 7 + `cift: "Çift ve evlilik"`, `cocuk_ergen: "Çocuk ve ergen"`, `ebeveynlik: "Ebeveynlik"`, `tukenmislik: "Tükenmişlik ve iş stresi"`, `duygudurum: "Depresyon ve duygudurum"`, `travma: "Travma"`, `yeme: "Yeme ve beden algısı"`, `bagimlilik: "Bağımlılık"`, `uyku: "Uyku sorunları"`, `cinsel: "Cinsel sorunlar"`, `norogelisim: "Nörogelişim"`, `psikotik: "Psikotik bozukluklar"`.
  - `OGRENCIYE_KAPALI_ALANLAR: readonly Alan[] = ["psikotik", "bagimlilik"]`
  - `ogrenciyeAcik(alan: Alan): boolean`
  - `alanlariSuz(alanlar: unknown[], ogrenci: boolean): Alan[]` — `ALANLAR`'da olmayanları ve (ogrenci ise) kapalıları atar, tekrarları kaldırır.

- [ ] **Step 1: Write the failing test** (`scripts/alanlar.test.mts`, `seans-kurallari.test.mts` biçiminde)

```ts
test("ALANLAR 19 alan içerir ve eski 7 alan korunur", () => {
  assert.equal(Object.keys(ALANLAR).length, 19);
  for (const a of ["kaygi", "iliski", "aile", "kariyer", "ozguven", "yas", "genel"]) assert.ok(a in ALANLAR);
});
test("öğrenciye kapalı alanlar yalnızca psikotik ve bagimlilik", () => {
  assert.deepEqual([...OGRENCIYE_KAPALI_ALANLAR].sort(), ["bagimlilik", "psikotik"]);
  assert.equal(ogrenciyeAcik("psikotik"), false);
  assert.equal(ogrenciyeAcik("yeme"), true);
});
test("alanlariSuz bilinmeyeni, tekrarı ve öğrenciye kapalıyı atar", () => {
  assert.deepEqual(alanlariSuz(["kaygi", "kaygi", "uydurma", "psikotik"], true), ["kaygi"]);
  assert.deepEqual(alanlariSuz(["kaygi", "psikotik"], false), ["kaygi", "psikotik"]);
});
```

- [ ] **Step 2:** `npm test` → FAIL (export yok).
- [ ] **Step 3:** Sabitleri ve iki fonksiyonu `sabitler.ts` içine ekle. Dosya başındaki "check listeleriyle aynı olmalı" yorumu Görev 2'deki migration ile sağlanır.
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit` temiz (Alan tipini kullanan yerler kendiliğinden genişler).
- [ ] **Step 5:** Commit: `Uzman alanlarına 12 yeni başlık ve öğrenci kuralı`

### Task 2: 0019 migration ve denetim SQL'i

**Files:**
- Create: `supabase/migrations/0019_yeni_alanlar.sql`
- Create: `supabase/denetim/0019_denetim.sql`

**Interfaces:**
- Consumes: Görev 1'deki 19 anahtar (aynen).
- Produces: veritabanı hata kodu `ALAN_OGRENCIYE_KAPALI` (Görev 3 bu metni yakalar).

- [ ] **Step 1: Denetim SQL'ini yaz** (`0018_denetim.sql` biçiminde: `begin; … rollback;`, uydurma `auth.users`, `assert`). Sınanacaklar:
  - `applications.topic = 'travma'` ve `group_sessions.topic = 'psikotik'` (bağımsız uzman) kabul edilir.
  - Öğrenci uzmanın `specialties` dizisine `psikotik` yazmak `ALAN_OGRENCIYE_KAPALI` verir; `yeme` kabul edilir.
  - Öğrenci uzmana `topic = 'bagimlilik'` başvurusu `ALAN_OGRENCIYE_KAPALI` verir; bağımsız uzmana kabul edilir.
  - `topic = 'uydurma'` reddedilir (check).
- [ ] **Step 2: Migration'ı yaz:**
  - `applications` ve `group_sessions` üzerindeki eski topic check'lerini `drop constraint if exists` ile kaldır (adlar büyük olasılıkla `applications_topic_check`, `group_sessions_topic_check`; SQL Editor'de `select conname from pg_constraint where conrelid = 'public.applications'::regclass` ile doğrula ve dosyaya yaz), 19 değerli yeni check ekle.
  - `expert_profiles` için `before insert or update of specialties` trigger: `kind = 'student'` ve dizi `psikotik` veya `bagimlilik` içeriyorsa `raise exception 'ALAN_OGRENCIYE_KAPALI'`. Trigger güncellemelerde `new.specialties` ile `old.specialties` aynıysa geçer (Review Focus 1: eski veri kaydı bloke etmesin).
  - `applications` için `before insert` trigger: hedef uzman `student` ve topic kapalı alansa aynı hata.
  - Fonksiyonlar `security definer`, `set search_path = public`, mevcut trigger fonksiyonları gibi.
- [ ] **Step 3:** Kullanıcıdan (veya Supabase erişimi varsa kendin) migration'ı, sonra denetim dosyasını SQL Editor'de çalıştır. Beklenen: denetim hatasız biter (`ROLLBACK`).
- [ ] **Step 4:** Commit: `0019: yeni alanlar ve öğrenciye kapalı alanlar`

### Task 3: Panel ve başvuru formlarında öğrenci kuralı

**Files:**
- Modify: `src/app/panel/ProfilFormu.tsx`, `src/app/panel/page.tsx:178`, `src/app/panel/islemler.ts:21`
- Modify: `src/app/uzmanlar/[id]/BasvuruFormu.tsx:32`, `src/app/uzmanlar/[id]/islemler.ts:19`

**Interfaces:**
- Consumes: `ogrenciyeAcik`, `alanlariSuz` (Görev 1), `ALAN_OGRENCIYE_KAPALI` (Görev 2).
- Produces: `ProfilFormu` yeni prop `ogrenci: boolean`.

- [ ] **Step 1:** `ProfilFormu` `ogrenci` prop'u alır; öğrenciyse kapalı alanlar listelenmez. `panel/page.tsx` `ogrenci={kullanici.rol === "student_expert"}` geçer; başlangıç `alanlar`'ı `alanlariSuz(..., ogrenci)` ile verilir.
- [ ] **Step 2:** `profilGuncelle` alanları `alanlariSuz(form.getAll("alanlar"), kullanici.rol === "student_expert")` ile süzer (mevcut `listedeMi` filtresinin yerine).
- [ ] **Step 3:** `BasvuruFormu` mevcut `ogrenci` prop'uyla kapalı alanları `<option>` listesinden çıkarır.
- [ ] **Step 4:** `basvuruYap`: `error.message.includes("ALAN_OGRENCIYE_KAPALI")` → `"Bu konu öğrenci uzmanlar için uygun değil. Lütfen bağımsız bir uzman seçin."` Ayrı bir sunucu sorgusu eklenmez; kuralı trigger uygular.
- [ ] **Step 5:** Doğrulama: `npx tsc --noEmit`, `npm run lint`; `npm run dev` ile öğrenci test hesabında (`test.ogrenci1@example.com`) panelde "Psikotik bozukluklar" görünmediğini, bağımsız uzmanda göründüğünü kontrol et.
- [ ] **Step 6:** Commit: `Öğrenci uzmanlara kapalı alanlar formlarda gizlenir`

### Task 4: Rahatsızlık verisi ve içerik

**Files:**
- Create: `src/app/psikolojik-rahatsizliklar/veri.ts`
- Test: `scripts/rahatsizliklar.test.mts`

**Interfaces:**
- Consumes: `ALANLAR`, `Alan`.
- Produces:
```ts
export type Kaynak = { ad: string; url: string };
export type Rahatsizlik = {
  ad: string; alan: Alan; agir: boolean; aciklama: string;
  belirtiler: string[];          // 3-5 sade madde
  yayginlik?: string;            // yalnızca kaynakta bulunursa; kaynak ve kapsam (dünya/ülke) metinde
  nedenler: string; tedavi: string; kaynaklar: Kaynak[];
};
export type His = { ad: string; kartlar: string[] };   // kartlar: Rahatsizlik.ad değerleri
export const RAHATSIZLIKLAR: Rahatsizlik[];             // Türkçe alfabetik
export const HISLER: His[];                             // 12-16 his
```

- [ ] **Step 1: Write the failing test**

```ts
test("26 rahatsızlık, adlar benzersiz ve Türkçe alfabetik", () => {
  assert.equal(RAHATSIZLIKLAR.length, 26);
  const adlar = RAHATSIZLIKLAR.map((r) => r.ad);
  assert.equal(new Set(adlar).size, 26);
  assert.deepEqual(adlar, [...adlar].sort((a, b) => a.localeCompare(b, "tr")));
});
test("ağır liste tam olarak spec'teki 7 kart", () => {
  assert.deepEqual(RAHATSIZLIKLAR.filter((r) => r.agir).map((r) => r.ad).sort((a, b) => a.localeCompare(b, "tr")),
    ["Anoreksiya", "Bipolar Bozukluk", "Bulimiya", "Kumar Bozukluğu", "Madde Kullanımı Bozukluğu", "Narkolepsi", "Şizofreni"]);
});
test("her kartın alanı geçerli, 3-5 belirti ve en az bir https kaynağı var", () => { /* her r için */ });
test("kart-alan eşleşmesi spec tablosuyla aynı", () => {
  // spec "Kart → alan eşleşmesi" tablosu: örn.
  assert.equal(bul("Uyum Bozukluğu").alan, "travma");
  assert.equal(bul("Obsesif Kompulsif Bozukluk").alan, "kaygi");
  assert.equal(bul("Narkolepsi").alan, "uyku");
  // tablodaki 26 satırın tamamı
});
test("her his var olan kartlara bağlanır ve her kart en az bir hisle bulunur", () => { /* Review Focus 4 */ });
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3: İçeriği yaz.** Mevcut 19 açıklamayı `page.tsx`'ten taşı; 7 yeni kartı ekle (Sosyal Kaygı Bozukluğu, Agorafobi, Kalıcı Depresif Bozukluk, Doğum Sonrası Depresyon, Uyum Bozukluğu, Tıkınırcasına Yeme Bozukluğu, Kumar Bozukluğu). Kaynaklar: DSM-5-TR, WHO (ICD-11 / bilgi sayfaları), NIMH. Yaygınlık rakamını yalnızca kaynağı açıp gördüysen yaz; açamadıysan alanı boş bırak ve son raporda hangi kartlarda boş kaldığını listele. His örnekleri spec'te; bir his ağır ve normal kartlara birlikte bağlanabilir.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit: `Rahatsızlık verisi: 26 kart, belirtiler, kaynaklar, hisler`

### Task 5: Kart ve his düğmeleri

**Files:**
- Create: `src/app/psikolojik-rahatsizliklar/kurallar.ts`
- Create: `src/app/psikolojik-rahatsizliklar/RahatsizlikListesi.tsx` (istemci)
- Modify: `src/app/psikolojik-rahatsizliklar/RahatsizlikKarti.tsx`, `page.tsx`
- Test: `scripts/rahatsizliklar.test.mts`

**Interfaces:**
- Consumes: `RAHATSIZLIKLAR`, `HISLER`, `Rahatsizlik` (Görev 4); `PsikologCizimi({ ampul }: { ampul: boolean })` (Görev 6). **Sıra: Görev 6, Görev 5'ten önce yapılır** (1, 2, 3, 4, 6, 5, 7).
- Produces:
  - `uzmanBaglantisi(r: { alan: Alan; agir: boolean }): string` → `/uzmanlar?alan=<alan>` veya `/uzmanlar?alan=<alan>&tur=independent`.
  - `oneCikanKartlar(secili: string[], hisler: His[]): Set<string> | null` → seçim boşsa `null` (hiçbiri soluk değil).

- [ ] **Step 1: Failing test**

```ts
test("ağır kart yalnızca bağımsız uzmanlara bağlanır", () => {
  assert.equal(uzmanBaglantisi({ alan: "psikotik", agir: true }), "/uzmanlar?alan=psikotik&tur=independent");
  assert.equal(uzmanBaglantisi({ alan: "kaygi", agir: false }), "/uzmanlar?alan=kaygi");
});
test("tüm ağır kartların bağlantısında tur=independent var", () => {
  for (const r of RAHATSIZLIKLAR.filter((r) => r.agir)) assert.match(uzmanBaglantisi(r), /tur=independent/);
});
test("oneCikanKartlar: boş seçim null, seçim birleşim kümesi", () => {
  const h = [{ ad: "A", kartlar: ["X", "Y"] }, { ad: "B", kartlar: ["Y", "Z"] }];
  assert.equal(oneCikanKartlar([], h), null);
  assert.deepEqual([...oneCikanKartlar(["A", "B"], h)!].sort(), ["X", "Y", "Z"]);
});
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** `kurallar.ts`'i yaz (saf, import'u yalnızca tipler ve `Alan`).
- [ ] **Step 4:** `RahatsizlikListesi` ("use client"): `useState<string[]>` his seçimi; "Neler yaşıyorsun? (birden fazla seçebilirsin)" başlığı; his düğmeleri `aria-pressed`, seçiliyken `bg-teal-700 text-white` + "✓"; seçim varken "Seçimi temizle" düğmesi; yanında `<PsikologCizimi ampul={secili.length > 0} />`; altında kart ızgarası, öne çıkmayan kartlar `opacity-50` (tıklanabilir kalır). Ekran okuyucu için seçim sonrası `aria-live="polite"` bir satır: `"{n} rahatsızlık öne çıkarıldı"`.
- [ ] **Step 5:** `RahatsizlikKarti` `Rahatsizlik` + `soluk: boolean` alır. Açık içerik sırası: açıklama → "Neler hissedilebilir?" listesi → `<details>` "Daha fazla" (Ne kadar yaygın? yalnızca `yayginlik` varsa · Neden ortaya çıkar? · Nasıl tedavi edilir? · Kaynaklar: `target="_blank" rel="noopener noreferrer"`) → `Link` dolgulu düğme (`rounded-lg bg-teal-700 px-4 py-2 text-white`) "Bu alanda çalışan uzmanları gör", `href={uzmanBaglantisi(r)}`.
- [ ] **Step 6:** `page.tsx` yalnızca başlık + bilgilendirme notu + `<RahatsizlikListesi />` kalır; eski sabit dizi silinir.
- [ ] **Step 7:** `npm test`, `npx tsc --noEmit`, `npm run lint`; `npm run dev` ile his seç/temizle, kart aç, "Daha fazla" aç, ağır karttaki bağlantıda `tur=independent` olduğunu kontrol et; adres çubuğunun his seçince değişmediğini kontrol et.
- [ ] **Step 8:** Commit: `Rahatsızlıklar sayfası: his düğmeleri ve ayrıntılı kartlar`

### Task 6: Psikolog çizimi ve animasyonu

**Files:**
- Create: `src/components/PsikologCizimi.tsx`
- Modify: `src/app/globals.css` (animasyonlar ve mevcut `prefers-reduced-motion` bloğu, satır ~237)

**Interfaces:**
- Produces: `export function PsikologCizimi({ ampul }: { ampul: boolean })`

- [ ] **Step 1:** SVG: `OturanKadin.tsx` tarzında (`stroke-slate-900`, `strokeWidth={4}`, yuvarlak uçlar, `Uzuv` ile çeneye giden kol, `fill-teal-100` gölge elipsi, `fill-teal-700` gövde, `fill-amber-200` ten). `aria-hidden="true"`. Başın üstünde `ampul ? <ampul grubu> : <soru işareti grubu>`. Mobilde `w-24`, `sm:w-32`.
- [ ] **Step 2:** `globals.css`: `psikolog-govde` (nefes), `psikolog-bas` (ara sıra yana eğilme), `psikolog-goz` (kırpma, `scaleY`), `psikolog-isaret` (yukarı-aşağı süzülme); mevcut `--kare` ve `steps()` kalıbıyla. Ampul belirirken kısa bir parlama (`psikolog-ampul`). Hepsini mevcut `prefers-reduced-motion: reduce` bloğuna `animation: none` olarak ekle.
- [ ] **Step 3:** `npm run dev`; tarayıcıda hareketi gör, his seçince ampule döndüğünü, temizleyince geri döndüğünü gör; DevTools'ta "Emulate prefers-reduced-motion: reduce" ile hareketin durduğunu doğrula.
- [ ] **Step 4:** Commit: `Psikolog çizimi ve animasyonu`

### Task 7: Boş liste, test verisi, belgeler

**Files:**
- Modify: `src/app/uzmanlar/page.tsx:98-103`
- Modify: `scripts/test-verisi.mts:30-75`
- Modify: `YAYIN-ONCESI.md`, `CLAUDE.md` (§6)

- [ ] **Step 1:** `/uzmanlar` boş durumda, `seciliAlan` varsa: `"Bu alanda henüz uzman yok."` + `adres({ alan: undefined, ara: undefined })` bağlantısı; metin `secili === "independent"` ise "Tüm bağımsız uzmanları gör", değilse "Tüm uzmanları gör". Diğer boş durum metinleri aynı kalır.
- [ ] **Step 2:** Test verisi: bağımsız uzmanlardan birine `duygudurum` ve `travma`, birine `psikotik`, öğrenciye `yeme` ekle (öğrenciye kapalı alan **ekleme**; trigger reddeder).
- [ ] **Step 3:** `YAYIN-ONCESI.md` "Hukuk / KVKK" altına: `- [ ] **Rahatsızlık metinlerini onaylayın.** /psikolojik-rahatsizliklar sayfasındaki açıklama, belirti, yaygınlık ve kaynakları proje sahibi okuyup onaylamalı.` CLAUDE.md §6'ya tek madde: yeni alanlar, öğrenciye kapalı alanlar (0019, `OGRENCIYE_KAPALI_ALANLAR`), ağır kartların `tur=independent` kuralı, his seçiminin tarayıcıdan çıkmadığı.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Elle: `/uzmanlar?alan=psikotik&tur=independent` (boşsa doğru metin), `/uzmanlar?alan=uydurma` (filtre yok sayılır, Review Focus 5).
- [ ] **Step 5:** Commit: `Uzman listesi boş durumu, test verisi ve belgeler`
