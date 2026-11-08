# Uzman Bulma Ölçeği Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ana sayfada pop-up ile açılan, 15 maddelik, yanıtları tarayıcıdan hiç çıkmayan ve danışana "İşte sana uygun uzmanlar" listesini gösteren ölçek.

**Architecture:** Ölçek mevcut isteğe bağlı modülde (`src/modules/olcek/`) yaşar. Sunucu bileşeni `OlcekAlani` modül açıksa ve kullanıcı uygunsa tüm onaylı uzmanları çeker, her biri için `UzmanKarti`'yı sunucuda çizer ve istemci bileşenine yalnızca küçük uzman özetleri + hazır kartları verir. Puanlama ve eşleştirme saf fonksiyonlardır (`puanlama.ts`), tarayıcıda çalışır, `node --test` ile test edilir.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Tailwind, Supabase (yalnızca mevcut `onayliUzmanlar()`), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-uzman-bulma-olcegi-design.md`

## Global Constraints

- Tüm arayüz metinleri Türkçe; ölçek ve sonuç metinleri taslaktır, proje sahibi onaylar.
- Yanıtlar, puanlar, grup ve sonuç **hiçbir yere** gitmez: sunucu isteği, URL, çerez, `localStorage`, `console.log`, analitik yok.
- `localStorage`'a yalnızca `olcek-davet-goruldu` anahtarı yazılır; her erişim `try/catch` içinde.
- Grup adları ekranda hiçbir yerde görünmez (kodda yalnızca `g1`…`g5` anahtarı).
- Modül kapalıyken (`OLCEK_MODULU_AKTIF` ≠ `"true"`) hiçbir sorgu yapılmaz, hiçbir şey çizilmez.
- Pop-up yalnızca giriş yapmamış ziyaretçi ve `client` rolüne; `expert`, `student_expert`, `admin` görmez.
- Hook metni birebir: başlık "Nereden başlayacağını bilmiyor musun?", alt metin "1 dakikalık birkaç soruyla sana uygun uzmanları gösterelim."
- Öğrenci bölümünde ücret/fiyat ifadesi yok; staj iddiasının yanına `<OnayGerekir />`.
- Next.js 16: kod yazmadan önce `AGENTS.md` ve `node_modules/next/dist/docs/` okunur.
- `src/lib/uzmanlar.ts` sunucu modülleri içerir (`supabaseSunucu`); istemci bileşenine yalnızca `import type` ile girebilir.
- `puanlama.ts` ve `maddeler.ts` testten doğrudan yüklenir: bu iki dosyada runtime importlar göreli ve `.ts` uzantılı olmalı (`./maddeler.ts`), `@/` takma adı yalnızca `import type` için kullanılabilir.

## Review Focus

1. Tarayıcı depolaması kapalı/gizli pencere → `localStorage` hata fırlatır; pop-up yine açılmalı, sayfa çökmemeli. (Task 3 manuel kontrol)
2. Ölçek yarıda Esc/✕ ile kapatılır → yanıtlar atılır; düğmeyle yeniden açılınca 1. maddeden başlar, eski sonuç görünmez. (Task 3 manuel kontrol)
3. Hiç onaylı uzman yok / Supabase ayarlı değil (`onayliUzmanlar()` → `[]`) → sonuç ekranı çökmez, "Tüm uzmanları gör" bağlantısı çıkar. (Task 1 testi `boş uzman listesi`)
4. Madde 9/10 yüksek ama başka grup kazanır → öğrenci bölümü yine gizli. (Task 1 testi)
5. Uzmanın `specialties` dizisinde bilinmeyen/eski bir alan → eşleşme bozulmaz, yok sayılır. (Task 1 testi `bilinmeyen alan`)
6. Uzman tüm alanları işaretleyerek sonuçta öne geçmeye çalışır → geçemez, herkes ~eşit sıklıkta görünür. (Task 1 testi `eşit rekabet`)

---

### Task 0: Ortak karıştırma ve `/uzmanlar` rastgele sıra

**Files:**
- Create: `src/lib/karistir.ts`
- Modify: `src/app/uzmanlar/page.tsx:31`
- Test: `scripts/karistir.test.mts`

**Interfaces:**
- Produces: `export function karistir<T>(liste: readonly T[], rastgele: () => number = Math.random): T[]` — yeni dizi döner (girdiyi değiştirmez), Fisher–Yates.

- [ ] **Step 1: Write the failing test** `scripts/karistir.test.mts`

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { karistir } from "../src/lib/karistir.ts";

test("aynı elemanlar, girdi değişmez", () => {
  const girdi = [1, 2, 3, 4, 5];
  const cikti = karistir(girdi);
  assert.deepEqual(girdi, [1, 2, 3, 4, 5]);
  assert.deepEqual([...cikti].sort(), [1, 2, 3, 4, 5]);
});

test("rastgele sabitlenince sonuç sabit", () => {
  assert.deepEqual(karistir([1, 2, 3], () => 0), karistir([1, 2, 3], () => 0));
});

test("eşit dağılım: 3 elemanın her biri ilk sırada ~1/3", () => {
  const sayac = [0, 0, 0];
  for (let i = 0; i < 30000; i++) sayac[karistir([0, 1, 2])[0]]++;
  for (const s of sayac) assert.ok(s > 9000 && s < 11000, String(sayac));
});

test("boş liste", () => assert.deepEqual(karistir([]), []));
```

- [ ] **Step 2: Run** `node --test scripts/karistir.test.mts` — Expected: FAIL (modül yok).
- [ ] **Step 3: Implement `karistir`** in `src/lib/karistir.ts` (runtime importu yok; testten doğrudan yüklenir). Yorum: uzmanlar arasında eşit rekabet için.
- [ ] **Step 4: `/uzmanlar`** — `const uzmanlar = karistir(await onayliUzmanlar({ ... }));`. `onayliUzmanlar()` içindeki `.order("display_name")` kalır (karıştırma sayfada yapılır; başka çağıran yok).
- [ ] **Step 5: Run** `npm test` ve `npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 6: Commit**

```bash
git add src/lib/karistir.ts scripts/karistir.test.mts src/app/uzmanlar/page.tsx
git commit -m "Uzman listesi her istekte rastgele sıralanır"
```

---

### Task 1: Maddeler ve puanlama (saf mantık + test)

**Files:**
- Create: `src/modules/olcek/maddeler.ts`
- Create: `src/modules/olcek/puanlama.ts`
- Test: `scripts/olcek.test.mts`

**Interfaces:**
- Produces (`maddeler.ts`):
  - `export type Grup = "g1" | "g2" | "g3" | "g4" | "g5";`
  - `export type Madde = { metin: string; grup: Grup | "psikotik" | "risk"; alanlar: Alan[] };`
  - `export const GIRIS = "Son iki haftada…";`
  - `export const YANITLAR = ["Hiç", "Bazen", "Sık sık", "Neredeyse her gün"] as const;`
  - `export const MADDELER: Madde[]` — 15 madde, spec tablosundaki sıra, metin ve alanlarla birebir.
- Produces (`puanlama.ts`):
  - `export type Yanit = 0 | 1 | 2 | 3;`
  - `export type Sonuc = { alanlar: Alan[]; psikotik: boolean; ogrenciGizli: boolean; risk: boolean; enUstAlan: Alan };`
  - `export function degerlendir(yanitlar: Yanit[]): Sonuc` — uzunluk 15 değilse `Error` fırlatır.
  - `export type UzmanOzeti = { id: string; kind: "independent" | "student"; display_name: string; specialties: Alan[] };`
  - `export function uzmanlariSec(uzmanlar: UzmanOzeti[], sonuc: Sonuc, rastgele: () => number = Math.random, enFazla = 3): { bagimsiz: UzmanOzeti[]; ogrenci: UzmanOzeti[] | null }` — `ogrenci` gizliyse `null`.
- Consumes: Task 0 `karistir` (`../../lib/karistir.ts` göreli importla).

- [ ] **Step 1: Write the failing test** `scripts/olcek.test.mts`

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ALANLAR } from "../src/lib/sabitler.ts";
import { MADDELER } from "../src/modules/olcek/maddeler.ts";
import { degerlendir, uzmanlariSec, type UzmanOzeti, type Yanit } from "../src/modules/olcek/puanlama.ts";

// y({ 9: 2 }) → 15 yanıt, belirtilen madde numaraları (1'den başlar) dışında hepsi 0
const y = (degerler: Record<number, Yanit> = {}): Yanit[] =>
  Array.from({ length: 15 }, (_, i) => degerler[i + 1] ?? 0);
const es = (a: string[], b: string[]) => assert.deepEqual([...a].sort(), [...b].sort());

test("15 madde, geçerli alanlar, risk en sonda", () => {
  assert.equal(MADDELER.length, 15);
  for (const m of MADDELER) for (const a of m.alanlar) assert.ok(a in ALANLAR, m.metin);
  assert.equal(MADDELER[14].grup, "risk");
  assert.equal(MADDELER[13].grup, "psikotik");
  for (const g of ["g1", "g2", "g3", "g4", "g5"]) assert.ok(MADDELER.filter((m) => m.grup === g).length >= 2, g);
});

test("tümü Hiç → genel", () => {
  const s = degerlendir(y());
  assert.deepEqual(s.alanlar, ["genel"]);
  assert.equal(s.enUstAlan, "genel");
  assert.equal(s.ogrenciGizli, false);
  assert.equal(s.risk, false);
});

test("yalnızca bağımlılık → yeme yok, öğrenci gizli", () => {
  const s = degerlendir(y({ 9: 3 }));
  assert.deepEqual(s.alanlar, ["bagimlilik"]);
  assert.equal(s.ogrenciGizli, true);
});

test("madde 9 Sık sık ama G1 kazanır → öğrenci gizli, bagimlilik alanı yok", () => {
  const s = degerlendir(y({ 1: 3, 2: 3, 3: 3, 9: 2 }));
  es(s.alanlar, ["kaygi", "tukenmislik", "uyku"]);
  assert.equal(s.ogrenciGizli, true);
});

test("madde 10 Bazen → öğrenci görünür", () => {
  assert.equal(degerlendir(y({ 1: 3, 2: 3, 3: 3, 10: 1 })).ogrenciGizli, false);
});

test("yalnızca Hiç dışındaki maddelerin alanları alınır", () => {
  assert.deepEqual(degerlendir(y({ 1: 3 })).alanlar, ["kaygi"]);
});

test("eşit iki grup → ikisi de", () => {
  es(degerlendir(y({ 4: 2, 5: 2, 6: 2, 7: 2 })).alanlar,
    ["duygudurum", "yas", "travma", "iliski", "cift", "cinsel", "aile", "ebeveynlik", "cocuk_ergen"]);
});

test("ikinci grup ≥1 ve en fazla 0,5 farkla alınır, <1 alınmaz", () => {
  es(degerlendir(y({ 4: 2, 5: 2, 1: 2, 2: 2, 3: 1 })).alanlar, ["duygudurum", "yas", "travma", "kaygi", "tukenmislik", "uyku"]);
  es(degerlendir(y({ 4: 2, 5: 2, 1: 2 })).alanlar, ["duygudurum", "yas", "travma"]);
});

test("psikotik + G1 → psikotik eklenir, öğrenci gizli", () => {
  const s = degerlendir(y({ 1: 3, 14: 1 }));
  es(s.alanlar, ["kaygi", "psikotik"]);
  assert.equal(s.psikotik, true);
  assert.equal(s.ogrenciGizli, true);
});

test("psikotik + tüm ortalamalar <1 → yalnızca psikotik", () => {
  assert.deepEqual(degerlendir(y({ 14: 2 })).alanlar, ["psikotik"]);
});

test("risk → risk ve öğrenci gizli", () => {
  const s = degerlendir(y({ 1: 3, 15: 1 }));
  assert.equal(s.risk, true);
  assert.equal(s.ogrenciGizli, true);
});

test("enUstAlan en yüksek yanıtlı eşleşen maddenin ilk alanı", () => {
  assert.equal(degerlendir(y({ 1: 1, 2: 3, 3: 2 })).enUstAlan, "tukenmislik");
});

test("uzunluk 15 değilse hata", () => {
  assert.throws(() => degerlendir([0, 1] as Yanit[]));
});

const u = (id: string, kind: UzmanOzeti["kind"], specialties: string[]): UzmanOzeti =>
  ({ id, kind, display_name: id, specialties: specialties as UzmanOzeti["specialties"] });

test("psikotik işaretliyse psikotik uzmanı her zaman başta", () => {
  const s = degerlendir(y({ 1: 3, 14: 1 }));
  const liste = [u("Cem", "independent", ["kaygi"]), u("Zeynep", "independent", ["psikotik"]), u("Bora", "independent", ["kaygi"])];
  for (let i = 0; i < 50; i++) assert.equal(uzmanlariSec(liste, s).bagimsiz[0].id, "Zeynep");
});

test("eşit rekabet: çok alan işaretleyen öne geçmez, herkes ~eşit görünür", () => {
  const s = degerlendir(y({ 1: 3, 2: 3, 3: 3 }));
  const liste = [
    u("Hepsi", "independent", ["kaygi", "tukenmislik", "uyku"]),
    ...["A", "B", "C", "D", "E"].map((id) => u(id, "independent", ["kaygi"])),
  ];
  const sayac: Record<string, number> = {};
  for (let i = 0; i < 6000; i++) for (const x of uzmanlariSec(liste, s).bagimsiz) sayac[x.id] = (sayac[x.id] ?? 0) + 1;
  // 6 uzman, 3 yer → her biri ~3000 kez
  for (const id of ["Hepsi", "A", "B", "C", "D", "E"]) assert.ok(sayac[id] > 2700 && sayac[id] < 3300, JSON.stringify(sayac));
});

test("en fazla 3, rastgele sabitlenince sonuç sabit", () => {
  const s = degerlendir(y({ 1: 3 }));
  const liste = ["A", "B", "C", "D", "E"].map((id) => u(id, "independent", ["kaygi"]));
  assert.equal(uzmanlariSec(liste, s).bagimsiz.length, 3);
  assert.deepEqual(uzmanlariSec(liste, s, () => 0.5), uzmanlariSec(liste, s, () => 0.5));
});

test("öğrenci gizliyse ogrenci null", () => {
  assert.equal(uzmanlariSec([u("A", "student", ["kaygi"])], degerlendir(y({ 1: 3, 15: 1 }))).ogrenci, null);
});

test("bölüm boşsa genel yedeği; yalnızca psikotikte yedek yok", () => {
  const liste = [u("G", "independent", ["genel"]), u("O", "student", ["genel"])];
  const s = degerlendir(y({ 1: 3 }));
  assert.deepEqual(uzmanlariSec(liste, s).bagimsiz.map((x) => x.id), ["G"]);
  assert.deepEqual(uzmanlariSec(liste, s).ogrenci?.map((x) => x.id), ["O"]);
  assert.deepEqual(uzmanlariSec(liste, degerlendir(y({ 14: 2 }))).bagimsiz, []);
});

test("boş uzman listesi", () => {
  assert.deepEqual(uzmanlariSec([], degerlendir(y({ 1: 3 }))), { bagimsiz: [], ogrenci: [] });
});

test("bilinmeyen alan yok sayılır", () => {
  const { bagimsiz } = uzmanlariSec([u("X", "independent", ["eski_alan", "kaygi"])], degerlendir(y({ 1: 3 })));
  assert.deepEqual(bagimsiz.map((x) => x.id), ["X"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/olcek.test.mts`
Expected: FAIL, `Cannot find module ... maddeler.ts`

- [ ] **Step 3: Implement `maddeler.ts`** — 15 madde, spec "Ölçek" tablosundaki sıra, metin, grup ve alanlarla birebir (madde 15: `grup: "risk"`, `alanlar: []`). Dosyanın başına yorum: metinler taslaktır, proje sahibi onaylar.

- [ ] **Step 4: Implement `degerlendir` ve `uzmanlariSec`** in `puanlama.ts`

Kurallar (spec "Puanlama ve eşleştirme" 1–8):
1. Grup puanı = gruptaki madde yanıtlarının ortalaması.
2. En yüksek ortalamalı grup alınır; diğer gruplardan ortalaması ≥ 1 ve en yükseğe en fazla 0,5 uzak olanlar da alınır. (Testteki "eşit iki grup" ve "≥1, 0,5" durumlarıyla tutarlı olmalı.)
3. Eşleşen alanlar: alınan gruplarda yanıtı > 0 olan maddelerin alanları (tekrarsız).
4. Madde 14 > 0 → `psikotik = true`, `psikotik` alanı eklenir.
5. Tüm ortalamalar < 1 ise: psikotik değilse `alanlar = ["genel"]`, psikotikse `alanlar = ["psikotik"]`. (Bu durumda 2–3. adımın sonucu atılır.)
6. `ogrenciGizli = risk || psikotik || madde9 >= 2 || madde10 >= 2`.
7. `risk = madde15 > 0`.
8. `enUstAlan`: eşleşen maddeler (psikotik dahil) içinde yanıtı en yüksek olanın ilk alanı, eşitlikte ölçekteki ilk madde; eşleşen madde yoksa `"genel"`.

`uzmanlariSec`: her `kind` için `specialties` ∩ `sonuc.alanlar` boş olmayanlar; `karistir(..., rastgele)`; psikotik ise `psikotik` alanı olanlar karışık listenin önüne alınır (kendi aralarında karışık kalır); ilk `enFazla`. Kesişim sayısı sıralamayı etkilemez. Bölüm boşsa ve `alanlar` `["psikotik"]` değilse aynı `kind` içinde `specialties` `genel` içerenler (karışık, ilk `enFazla`). `ogrenciGizli` ise `ogrenci: null`.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test scripts/olcek.test.mts` — Expected: tüm testler PASS.
Run: `npm test` — Expected: mevcut testler de PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/olcek/maddeler.ts src/modules/olcek/puanlama.ts scripts/olcek.test.mts
git commit -m "Ölçek: maddeler ve puanlama kuralları"
```

---

### Task 2: Rahatsızlıklar sayfasına "Oyun ve İnternet Bağımlılığı" kartı

**Files:**
- Modify: `src/app/psikolojik-rahatsizliklar/veri.ts` (`RAHATSIZLIKLAR`, `HISLER`)
- Test: `scripts/rahatsizliklar.test.mts`

**Interfaces:** Consumes mevcut `Rahatsizlik` tipi. Diğer görevlerden bağımsız.

- [ ] **Step 1: Update test** `scripts/rahatsizliklar.test.mts`
  - `26` → `27` (uzunluk, benzersizlik, son `satir` kontrolü).
  - Ağır liste: `"Oyun ve İnternet Bağımlılığı"` eklenir (Türkçe sıralı yerine).
  - Kart-alan tablosu: `bagimlilik: [..., "Oyun ve İnternet Bağımlılığı"]`.
  - Yeni test: `"Bırakmak istiyorum ama bırakamıyorum"` hissinin `kartlar` dizisi `"Oyun ve İnternet Bağımlılığı"` içerir.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/rahatsizliklar.test.mts` — Expected: FAIL (26 ≠ 27).

- [ ] **Step 3: Add the card** — Türkçe alfabetik yerine (`Obsesif…` ile `Otizm…` arasına, `localeCompare("tr")` testi doğrular): `ad: "Oyun ve İnternet Bağımlılığı"`, `alan: "bagimlilik"`, `agir: true` (öğrenciye kapalı alan; `uzmanBaglantisi` `&tur=independent` ekler), 3–5 birinci tekil şahıs belirti, `nedenler`, `tedavi`; kaynaklar: `ICD` ve `DSM`. `aciklama` metninde açıkça: ICD-11'de "oyun bozukluğu" (6C51) resmi tanıdır; DSM-5-TR'de "internet oyun bozukluğu" yalnızca ileride araştırılacak durumlar bölümündedir; sosyal medya ve genel internet kullanımı için resmi tanı yoktur. `yayginlik` yazılmaz (kaynakta doğrulanmadıkça). Kartı `HISLER` içindeki "Bırakmak istiyorum ama bırakamıyorum" girdisine ekle.

- [ ] **Step 4: Run tests**

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/psikolojik-rahatsizliklar/veri.ts scripts/rahatsizliklar.test.mts
git commit -m "Rahatsızlıklar: oyun ve internet bağımlılığı kartı"
```

---

### Task 3: Pop-up, ölçek akışı ve sonuç ekranı

**Files:**
- Modify: `src/modules/olcek/index.tsx` (`OlcekAlani` → async sunucu bileşeni)
- Modify: `src/modules/olcek/OlcekPenceresi.tsx` (pasif pencere → ölçek akışı)
- Modify: `src/app/page.tsx` yalnızca `<OlcekAlani />` kullanımı aynı kalır; değişiklik gerekmezse dokunma.

**Interfaces:**
- Consumes: Task 1 `MADDELER`, `GIRIS`, `YANITLAR`, `degerlendir`, `uzmanlariSec`, `UzmanOzeti`, `Yanit`, `Sonuc`; mevcut `mevcutKullanici()` (`@/lib/oturum`), `onayliUzmanlar()` (`@/lib/uzmanlar`), `UzmanKarti`, `OnayGerekir`, `ACIL_HATLAR` (`@/lib/acil-hatlar`).
- Produces: `OlcekPenceresi({ uzmanlar, kartlar }: { uzmanlar: UzmanOzeti[]; kartlar: Record<string, React.ReactNode> })`.

- [ ] **Step 1: `OlcekAlani`** (`index.tsx`, sunucu)
  - `if (!olcekModuluAktif()) return null;` ilk satır kalır (sorgudan önce).
  - `const kullanici = await mevcutKullanici(); if (kullanici && kullanici.rol !== "client") return null;`
  - `const liste = await onayliUzmanlar();`
  - `uzmanlar` = `liste.map(({ id, kind, display_name, specialties }) => ...)`; `kartlar` = `Object.fromEntries(liste.map((x) => [x.id, <UzmanKarti uzman={x} />]))`.
  - Yorum: `// shortcut: tüm onaylı uzmanlar ana sayfaya gömülür; uzman sayısı yüzleri aşınca küçük sayfalı istemci sorgusu düşünülmeli.`

- [ ] **Step 2: `OlcekPenceresi`** (`"use client"`, mevcut `<dialog>` + `showModal()` korunur)

  Durum: `adim: "davet" | number | "sonuc"`, `yanitlar: Yanit[]`. Pencere kapanınca (`onClose`) `adim` ve `yanitlar` sıfırlanır.

  Davet ekranı (birebir metin): başlık `Nereden başlayacağını bilmiyor musun?` (Lora başlık sınıfı, `text-slate-900`), alt metin `1 dakikalık birkaç soruyla sana uygun uzmanları gösterelim.`, düğmeler `Başlayalım` (`bg-teal-700 text-white`) ve `Şimdi değil` (`form method="dialog"`), sağ üstte `aria-label="Kapat"` ✕.

  Otomatik açılma (`useEffect`): `localStorage.getItem("olcek-davet-goruldu")` yoksa, 8 sn sonra **veya** sayfa yüksekliğinin %30'u kaydırılınca (hangisi önce) `adim = "davet"` ile `showModal()`, ardından `setItem("olcek-davet-goruldu", "1")`. Her depolama erişimi `try/catch`; hata varsa yine açılır. Zamanlayıcı ve `scroll` dinleyicisi temizlenir.

  Düğme: mevcut "Ölçekler" düğmesinin metni `Sana uygun uzmanı bul` olur; tıklayınca `adim = 0` ile açar (daveti atlar).

  Madde ekranı: üstte ilerleme (`<progress value={i + 1} max={15}>` + `aria-label`), `GIRIS`, madde metni, 4 `YANITLAR` düğmesi (her biri `type="button"`); tıklayınca yanıt kaydedilir ve sonraki maddeye geçilir; son maddeden sonra `adim = "sonuc"`. `i > 0` iken `Geri` düğmesi.

  Sonuç ekranı (`degerlendir(yanitlar)` → `uzmanlariSec(uzmanlar, sonuc)`; seçim sonuç ekranına geçerken **bir kez** hesaplanıp durumda tutulur, yeniden çizimde liste karışmaz):
  1. `sonuc.risk` ise en üstte kırmızı kutu (`AcilDurumKutusu` sohbete özel metin içerdiği için kullanılmaz): `Kendine zarar verme düşüncen varsa yalnız değilsin. Hemen 112'yi ara.` + `ACIL_HATLAR` listesi `tel:` bağlantılarıyla (`AcilDurumKutusu`'ndaki liste biçimi).
  2. `<h2>İşte sana uygun uzmanlar</h2>`
  3. `<h3>Bağımsız uzmanlar</h3>` + `Belgeleri onaylanmış psikolog ve psikolojik danışmanlar. Ücretli görüşme yaparlar; bazıları ücretsiz ön görüşme sunar.` + `kartlar[id]` listesi + `Tümünü gör` → `/uzmanlar?alan=${sonuc.enUstAlan}&tur=independent`.
  4. `ogrenci !== null` ise `<h3>Öğrenci uzmanlar</h3>` + `Son sınıf Psikoloji/PDR öğrencileri. Görüşmeleri ücretsizdir ve staj kapsamındadır.` `<OnayGerekir />` + kartlar + `Tümünü gör` → `...&tur=student`.
  5. Bir bölüm boşsa kart yerine `Tüm uzmanları gör` → `/uzmanlar?tur=<kind>`.
  6. Altta: `Bu bir tanı değildir; yalnızca başlangıç için bir öneridir.`

  Hiçbir yerde `fetch`, `router.push` ile yanıt/sonuç, `console.*` veya grup adı yok. Pencere `max-h-[90vh] overflow-y-auto`, telefonda tam genişliğe yakın.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit` — Expected: hata yok.
Run: `npm run lint` — Expected: hata yok.
Run: `npm run build` — Expected: başarılı.

- [ ] **Step 4: Manual check** (`OLCEK_MODULU_AKTIF=true`, `npm run dev`, test verisiyle)
  - Gizli pencerede ana sayfa: 8 sn içinde davet açılır; kaydırınca daha erken açılır; "Şimdi değil" sonrası yenilemede açılmaz.
  - Tarayıcı depolaması engelliyken sayfa çökmez, davet açılır (Review Focus 1).
  - Yarıda Esc → düğmeyle yeniden aç → 1. madde, boş durum (Review Focus 2).
  - Madde 1–3 "Neredeyse her gün", geri kalanı "Hiç" → iki bölüm, kaygı uzmanları.
  - Risk maddesi "Bazen" → kırmızı kutu en üstte, öğrenci bölümü yok.
  - Uzman hesabıyla giriş → ne davet ne düğme görünür.
  - DevTools Network: ölçek sırasında ve sonuçta hiçbir istek yok; Application → Local Storage: yalnızca `olcek-davet-goruldu`.
  - `OLCEK_MODULU_AKTIF=false` → düğme ve davet yok, hata yok.

- [ ] **Step 5: Commit**

```bash
git add src/modules/olcek/index.tsx src/modules/olcek/OlcekPenceresi.tsx
git commit -m "Ölçek: ana sayfa davet penceresi, sorular ve sonuç ekranı"
```

---

### Task 4: Belgeler

**Files:**
- Modify: `src/app/cerezler/page.tsx` (`CEREZLER` yanına tarayıcı depolama notu)
- Modify: `README.md:169-172`
- Modify: `YAYIN-ONCESI.md`
- Modify: `CLAUDE.md` (§6 sonuna bir madde)

- [ ] **Step 1: `/cerezler`** — `CEREZLER` listesine bir girdi: `ad: "olcek-davet-goruldu (tarayıcı depolaması)"`, `amac: "Ana sayfadaki ölçek davetini bir kez gösterdikten sonra tekrar göstermemek için kullanılır. Ölçek yanıtlarınız kaydedilmez."`, `sure: "Tarayıcı verilerinizi silene kadar"`.
- [ ] **Step 2: README** — "Ölçek modülünü açıp kapatma" bölümü: `true` iken ana sayfada uzman bulma ölçeği (davet penceresi + "Sana uygun uzmanı bul" düğmesi) açılır; yanıtlar tarayıcıdan çıkmaz.
- [ ] **Step 3: YAYIN-ONCESI** — madde: `- [ ] **Ölçek metinlerini onaylayın.** src/modules/olcek/maddeler.ts içindeki 15 madde, sonuç ekranı açıklamaları ve "Oyun ve İnternet Bağımlılığı" kartı proje sahibi tarafından onaylanmalı.`
- [ ] **Step 4: CLAUDE.md** — §6 sonuna: `- Uzman bulma ölçeği (kullanıcı kararı, 2026-11-08; tasarım: docs/superpowers/specs/2026-11-08-uzman-bulma-olcegi-design.md): ölçek modülünde, yanıtlar tarayıcıdan çıkmaz, grup adları görünmez. Risk, psikotik madde veya yüksek bağımlılık yanıtında öğrenci uzmanlar gösterilmez. Maddeler src/modules/olcek/maddeler.ts içindedir ve taslaktır. Uzmanlar arasında eşit rekabet: ölçek sonucu ve /uzmanlar listesi rastgele sıralanır (src/lib/karistir.ts); eşleşen alan sayısı sıralamayı etkilemez.`
- [ ] **Step 5: Verify** — `npm test` ve `npm run build` PASS.
- [ ] **Step 6: Commit**

```bash
git add src/app/cerezler/page.tsx README.md YAYIN-ONCESI.md CLAUDE.md
git commit -m "Ölçek: belgeler ve çerez bildirimi"
```
