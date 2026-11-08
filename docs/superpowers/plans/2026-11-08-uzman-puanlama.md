# Uzman Puanlama (Yıldız) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Danışanlar, en az 2 tamamlanmış seans yaptıkları bağımsız uzmanlara 1–5 yıldız verir. `/uzmanlar` ve ölçek sonucu ağırlıklı puana göre sıralanır. Yıldızlar kartta ve profilde animasyonlu görünür.

**Architecture:** Puanlar yeni bir tabloda (`expert_ratings`) durur. Bu tabloya yalnızca `security definer` SQL fonksiyonları yazar, onları da sunucu eylemleri gizli anahtarlı istemciyle (`supabaseYonetici`) çağırır. Bu, `0017` dosyasındaki `seans_yapilmadi_bildir` ile aynı düzendir. Herkese açık olan yalnızca uzman başına özet bilgisidir: `uzman_vitrini` görünümüne `puan_ortalama` ve `puan_sayisi` sütunları eklenir. Sıralama, tarayıcıda da çalışabilen saf bir TypeScript fonksiyonudur (`src/lib/siralama.ts`). Hem `/uzmanlar` sayfası hem ölçek bu fonksiyonu kullanır.

**Tech Stack:** Next.js 16 (App Router, server actions), TypeScript, Tailwind, Supabase Postgres (RLS, views, plpgsql), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-uzman-puanlama-design.md`. Uygulayıcı bu belgeyi de okumalı.

## Global Constraints

- Kod yazmadan önce `AGENTS.md` dosyasını ve `node_modules/next/dist/docs/` klasörünü okuyun. Next.js 16'da birçok şey değişti.
- Arayüzdeki tüm metinler Türkçe olmalı. Ortalama bir ondalıkla ve virgülle yazılır: `4,2` (`toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })`).
- Sabitler: `C = 5`, `m = 3,5`, alt bölüm sınırı `2,5`. Formül: `agirlikli = (C*m + ortalama*sayi) / (C + sayi)`.
- Tamamlanmış seans şu `session_offers` kaydıdır:
  - `status='confirmed'`
  - `ends_at < now()`
  - `group_session_id is null`
  - `price_kurus is not null`
  - bu seans için `category='seans_yapilmadi'` olan bir `conversation_flags` kaydı **yok**. Kaydın durumu önemli değil.
- Puan vermek için o danışan–uzman çiftinde bu türden **en az 2** seans gerekir. Uzman `kind='independent'` ve onaylı olmalı (`public.uzman_onayli_mi`).
- Öğrenci uzmanlar puanlanmaz, yıldız göstermez ve sıralamada her zaman orta (rastgele) bölümde durur.
- Puanla birlikte yazılı yorum alınmaz.
- Yıldız renkleri:
  - dolu: dolgu `#F5B82E`, kenar `#9A6B00`
  - boş: dolgu `#FFFFFF`, kenar `#9A6B00`
  - kenar kalınlığı: 1,4 (gösterim), 1,2 (giriş)
- Animasyonlar saniyede 18 kare düzenindedir (`--kare: calc(1s / 18)`, `steps()`). `prefers-reduced-motion` kuralı `globals.css` dosyasında zaten var, ayrıca kural eklenmez.
- Her yeni tabloda RLS açık olmalı. `anon` ve `authenticated` için tablo izinleri `revoke all` ile kaldırılır. Yeni fonksiyonlarda `execute` izni `public, anon, authenticated` için kaldırılır, yalnızca `service_role` için verilir.
- Puan değeri log'lara ve hata mesajlarına yazılmaz.
- Ölçek modülü kapalıyken (`OLCEK_MODULU_AKTIF=false`) puanlama eksiksiz çalışmalı. Puanlama kodu `src/modules/olcek/` klasöründen hiçbir şey import etmez.
- Commit mesajları Türkçe yazılır, mevcut düzene uyar (`Puanlama: ...`) ve sonuna `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` satırı eklenir.

## Review Focus

1. **Uzmanın puan sayısı az (1–2):** Uzman kartta "★ 5,0 (1 değerlendirme)" görür ve kimin verdiğini öğrenemez. Hiçbir API satır düzeyinde puan döndürmez. Bunu Task 2'deki SQL kontrolü doğrular: `authenticated` rolüyle `select * from expert_ratings` sorgusu izin hatası verir.
2. **Danışan puan verdikten sonra "seans yapılmadı" bildirir:** Sayılan seans 2'nin altına düşerse puan silinir. 3 seanstan biri bildirilirse puan kalır. Task 2'deki SQL kontrolü bunu doğrular.
3. **Puanı olmayan uzmanlar listede her açılışta farklı sırada olmalı, puanlılar ise sabit sırada kalmalı.** Task 1'deki testler bunu doğrular.
4. **Pencere Esc ile kapatılırsa:** Kalıcı kayıt yazılmaz. Pencere aynı tarayıcı oturumunda bir daha çıkmaz, yeni oturumda yine çıkar. Task 6'daki elle kontrol bunu doğrular.
5. **Ölçek kapalıyken veya uzman öğrenciyken:** Profilde puan formu, kartta yıldız ve sayfada hata görünmez. Task 4/5'teki elle kontrol ve Task 1'deki "öğrenci her zaman ortada" testi bunu doğrular.

---

### Task 1: Saf sıralama fonksiyonu

**Files:**
- Create: `src/lib/siralama.ts`
- Test: `scripts/siralama.test.mts`

**Interfaces:**
- Consumes: `karistir` (`src/lib/karistir.ts`; `import { karistir } from "./karistir.ts"`. Göreli yol ve `.ts` uzantısı şart, çünkü `node --test` dosyayı doğrudan çalıştırır. Bu dosyaya da çalışma anında import eklenmemeli).
- Produces:
  ```ts
  export const PUAN_ONCEL_AGIRLIK = 5;
  export const PUAN_ONCEL_ORTALAMA = 3.5;
  export const PUAN_ALT_SINIR = 2.5;
  export type PuanOzeti = { kind: "independent" | "student"; puan_ortalama: number | null; puan_sayisi: number };
  export function agirlikliPuan(ortalama: number, sayi: number): number;
  export function puanaGoreSirala<T extends PuanOzeti>(liste: readonly T[], rastgele?: () => number): T[];
  export function yildizYuvarla(ortalama: number): number; // en yakın 0,5
  ```

- [ ] **Step 1: Write the failing tests** in `scripts/siralama.test.mts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { agirlikliPuan, puanaGoreSirala, yildizYuvarla } from "../src/lib/siralama.ts";

const b = (id: string, ort: number | null, sayi: number) => ({ id, kind: "independent" as const, puan_ortalama: ort, puan_sayisi: sayi });
const o = (id: string) => ({ id, kind: "student" as const, puan_ortalama: null, puan_sayisi: 0 });

test("ağırlıklı puan örnekleri tasarımla aynı", () => {
  assert.equal(agirlikliPuan(5, 1).toFixed(2), "3.75");
  assert.equal(agirlikliPuan(4.2, 100).toFixed(2), "4.17");
  assert.equal(agirlikliPuan(1, 1).toFixed(2), "3.08");
});

test("100 kişiden 4,2 alan, 1 kişiden 5 alanın önünde", () => {
  assert.deepEqual(puanaGoreSirala([b("tek5", 5, 1), b("yuz42", 4.2, 100)]).map((x) => x.id), ["yuz42", "tek5"]);
});

test("üç bölüm: iyi puanlı > puansız ve öğrenci > düşük puanlı", () => {
  const liste = [b("dusuk", 1, 4), b("puansiz", null, 0), o("ogr"), b("iyi", 4, 10), b("tek1", 1, 1)];
  const sonuc = puanaGoreSirala(liste, () => 0.3).map((x) => x.id);
  assert.deepEqual(sonuc.slice(0, 2), ["iyi", "tek1"]); // tek1: 3,08 >= 2,5 -> üst bölüm
  assert.deepEqual(sonuc.slice(2, 4).sort(), ["ogr", "puansiz"]);
  assert.equal(sonuc[4], "dusuk"); // 4 × 1 yıldız: 21,5 / 9 = 2,39 -> alt bölüm
});

test("alt bölüm için 4 tane 1 yıldız gerekir", () => {
  assert.ok(agirlikliPuan(1, 3) >= 2.5); // 2,5625
  assert.ok(agirlikliPuan(1, 4) < 2.5); // 2,39
});

test("öğrenci uzman puan bilgisi olsa bile ortada kalır", () => {
  const ogrPuanli = { id: "ogr", kind: "student" as const, puan_ortalama: 5, puan_sayisi: 50 };
  const sonuc = puanaGoreSirala([ogrPuanli, b("iyi", 4, 10)], () => 0.1).map((x) => x.id);
  assert.deepEqual(sonuc, ["iyi", "ogr"]);
});

test("puansızlar karışık, puanlılar sabit sırada", () => {
  const liste = [b("A", 4.5, 20), b("B", 4, 20), ...["p1", "p2", "p3", "p4"].map((id) => b(id, null, 0))];
  const ilkPuansizlar = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const s = puanaGoreSirala(liste).map((x) => x.id);
    assert.deepEqual(s.slice(0, 2), ["A", "B"]);
    ilkPuansizlar.add(s[2]);
  }
  assert.equal(ilkPuansizlar.size, 4);
});

test("girdi değiştirilmez", () => {
  const liste = [b("p", null, 0), b("A", 4, 5)];
  puanaGoreSirala(liste);
  assert.deepEqual(liste.map((x) => x.id), ["p", "A"]);
});

test("yıldız en yakın yarıma yuvarlanır", () => {
  assert.equal(yildizYuvarla(4.2), 4);
  assert.equal(yildizYuvarla(4.3), 4.5);
  assert.equal(yildizYuvarla(4.75), 5);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL because `siralama.ts` does not exist yet ("Cannot find module").

- [ ] **Step 3: Implement** `src/lib/siralama.ts`. Steps:
  1. Split the list into three: puanlı ve `>= PUAN_ALT_SINIR` (üst), `kind==='student' || puan_sayisi===0 || puan_ortalama===null` (orta), and the rest (alt).
  2. Run `karistir(..., rastgele)` on each part. Then sort the top and bottom parts by weighted score from high to low with a stable `sort`. This way ties stay random.
  3. Keep the file comment short: "Eşit rekabet: puansızlar rastgele; puanlılar ağırlıklı ortalamayla (Bayes)."

- [ ] **Step 4: Run** `npm test`. Expected: all tests PASS, including the old ones.

- [ ] **Step 5: Commit**
```bash
git add src/lib/siralama.ts scripts/siralama.test.mts
git commit -m "Puanlama: ağırlıklı puanla sıralama fonksiyonu"
```

---

### Task 2: Veritabanı (migration 0020)

**Files:**
- Create: `supabase/migrations/0020_uzman_puanlari.sql`

**Interfaces:**
- Produces (SQL; parametre adları sabit, Task 3 bunları `rpc` ile çağırır):
  - `public.expert_ratings`:
    - `id uuid pk default gen_random_uuid()`
    - `expert_id uuid not null references public.expert_profiles(id) on delete cascade`
    - `client_id uuid references public.profiles(id) on delete set null`
    - `rating smallint not null check (rating between 1 and 5)`
    - `created_at timestamptz not null default now()`
    - `updated_at timestamptz not null default now()`
    - `unique (expert_id, client_id)`
  - `public.rating_prompt_dismissals`:
    - `client_id uuid references public.profiles(id) on delete cascade`
    - `expert_id uuid references public.expert_profiles(id) on delete cascade`
    - `created_at timestamptz default now()`
    - `primary key (client_id, expert_id)`
  - `public.puan_sayilan_seans(p_danisan uuid, p_uzman uuid) returns int`: `stable`, sayar; tanım Global Constraints'te.
  - `public.uzman_puanla(p_danisan uuid, p_uzman uuid, p_puan int) returns void`:
    - Puan 1–5 değilse `raise exception 'GECERSIZ_PUAN'`.
    - Uzman bağımsız ve onaylı değilse veya seans sayısı 2'den azsa `raise exception 'PUAN_SARTI_YOK'`.
    - Bu kontrollerden geçerse `insert ... on conflict (expert_id, client_id) do update set rating, updated_at = now()`.
  - `public.danisan_puan_durumu(p_danisan uuid, p_uzman uuid) returns table (puan_verebilir boolean, puanim smallint)`
  - `public.bekleyen_degerlendirme(p_danisan uuid) returns table (expert_id uuid, display_name text)`:
    - En fazla 1 satır döner.
    - Uzman: puan verilebilir durumda, danışan henüz puan vermemiş, `rating_prompt_dismissals` kaydı yok, bağımsız ve onaylı.
    - Birden fazla uzman uygunsa en son biten sayılan seansın uzmanı seçilir.
  - `public.degerlendirme_ertele(p_danisan uuid, p_uzman uuid) returns void`: `insert ... on conflict do nothing`.
  - Trigger `conversation_flags_puan_geri_al`:
    - `after insert on public.conversation_flags`, `for each row when (new.category = 'seans_yapilmadi' and new.session_offer_id is not null)`.
    - İlgili seansın `client_id` ve `expert_id` değerlerini bulur.
    - `puan_sayilan_seans(...) < 2` ise o çiftin `expert_ratings` satırını siler.
  - `public.uzman_vitrini`: `0016` tanımı **aynen** kalır, en sona iki sütun eklenir (`create or replace view` yalnızca sona sütun eklemeye izin verir):
    - `puan_ortalama numeric`: yalnızca bağımsız uzmanda, puan yoksa `null`; `round(avg(rating), 4)`.
    - `puan_sayisi int`: öğrenci uzmanda ve puan yoksa `0`.
    - Uzman başına bir `left join lateral` alt sorgusuyla hesaplanır.
    - `security_barrier`, `revoke all` ve `grant select` satırları tekrarlanır.

- [ ] **Step 1: Write the file.** Follow the existing style:
  - Başlık yorumu: amaç ve "0019 dosyasından SONRA çalıştırın", tekrar çalıştırılınca hata vermez.
  - `create table if not exists`, `create or replace function`, `drop trigger if exists`.
  - Fonksiyonlar `security definer set search_path = ''` ile yazılır, tablo adlarının başında `public.` olur.
  - Her iki tabloda RLS açılır. `revoke all ... from anon, authenticated` uygulanır, okuma politikası **yazılmaz**: satırları hiçbir istemci rolü okuyamaz.
  - Fonksiyonlarda `revoke execute ... from public, anon, authenticated;` ve `grant execute ... to service_role;` uygulanır. Trigger fonksiyonuna yalnızca `revoke` uygulanır.

- [ ] **Step 2: Run the SQL checks.** Bu adımı ancak migration Supabase SQL Editor'de çalıştırıldıktan sonra yapın. Projede yerel veritabanı yok, bu yüzden proje sahibi çalıştırır. Test verisiyle (Task 8) veya `session_offers` üzerinde elle oluşturulan kayıtlarla şu kontrolleri yapın. Sonuçları rapora yazın:
  1. 1 sayılan seansı olan çift için `select public.uzman_puanla(d, u, 5)` → `PUAN_SARTI_YOK`.
  2. 2 seans → başarılı. Aynı çağrı `3` ile tekrarlanınca satır sayısı 1 kalır, `rating = 3` olur.
  3. Bu iki seanstan birine `conversation_flags` (`category='seans_yapilmadi'`, `session_offer_id`) eklenince puan satırı silinir.
  4. 3 seans varken biri bildirilirse puan kalır.
  5. `price_kurus is null` olan (öğrenci) seanslar sayılmaz.
  6. `set role authenticated; select * from public.expert_ratings;` → izin hatası. `select puan_ortalama, puan_sayisi from public.uzman_vitrini` → çalışır.
  7. `delete from public.profiles where id = <danışan>` (test hesabı) → puan satırı kalır, `client_id` boş olur.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/0020_uzman_puanlari.sql
git commit -m "Puanlama: puan tablosu, şart kontrolü ve vitrin özeti (0020)"
```

---

### Task 3: Veri katmanı ve sunucu eylemleri

**Files:**
- Modify: `src/lib/uzmanlar.ts`. Bu dosyada `Uzman` tipine `puan_ortalama: number | null; puan_sayisi: number` eklenir, `ALANLAR_SORGU` sonuna `, puan_ortalama, puan_sayisi` eklenir. PostgREST `numeric` değeri metin döndürebilir; `fotograflariEkle` içinde `puan_ortalama` için `Number(...)` dönüşümü yapılır, `null` korunur.
- Create: `src/lib/puanlar.ts` (server-only)
- Create: `src/app/uzmanlar/[id]/puan-islemleri.ts` (`"use server"`)

**Interfaces:**
- Consumes: Task 2 RPC adları. `supabaseYonetici` (`src/lib/supabase/yonetici.ts`), `mevcutKullanici` (`src/lib/oturum.ts`), `FormDurumu` (`src/lib/hatalar.ts`).
- Produces:
  ```ts
  // src/lib/puanlar.ts
  export const danisanPuanDurumu: (danisanId: string, uzmanId: string) => Promise<{ puanVerebilir: boolean; puanim: number | null }>;
  export const bekleyenDegerlendirme: (danisanId: string) => Promise<{ uzmanId: string; uzmanAdi: string } | null>; // React cache() ile sarılı
  // puan-islemleri.ts
  export async function puanVer(_onceki: FormDurumu, form: FormData): Promise<FormDurumu>; // form: uzmanId, puan
  export async function degerlendirmeyiErtele(uzmanId: string): Promise<void>;
  ```

- [ ] **Step 1: Implement** `src/lib/puanlar.ts`. Supabase ayarlı değilse (`supabaseAyarlari()`) iki fonksiyon da güvenli boş değer döner: `{ puanVerebilir: false, puanim: null }` / `null`. RPC hatasında da aynı boş değer döner, hata içeriği log'a yazılmaz.

- [ ] **Step 2: Implement** `puanVer`:
  - Giriş yoksa: `"Puan vermek için giriş yapın."`
  - Rol `client` değilse: `"Yalnızca danışan hesapları puan verebilir."`
  - `puan`, 1–5 arası tam sayı değilse: `"Lütfen 1 ile 5 arasında bir puan seçin."`
  - RPC `uzman_puanla` çağrılır. Hata mesajı `PUAN_SARTI_YOK` içeriyorsa: `"Puan verebilmek için bu uzmanla en az 2 görüşmeyi tamamlamış olmalısınız."`
  - Diğer hatalarda: `"Puan kaydedilemedi. Lütfen tekrar deneyin."`
  - Başarıda `revalidatePath("/uzmanlar")`, `revalidatePath(\`/uzmanlar/${uzmanId}\`)` çağrılır ve `{ basari: "✓ Puanınız kaydedildi. Teşekkürler!" }` döner.

  `degerlendirmeyiErtele`: yalnızca `client` rolüyle çalışır, başka rolde sessizce hiçbir şey yapmaz. RPC `degerlendirme_ertele` çağrılır.

- [ ] **Step 3: Run** `npx tsc --noEmit` and `npm run lint`. Expected: no errors. `onayliUzmanlar`, `uzmanGetir` and `onGorusmeYapanUzmanlar` now return the new fields.

- [ ] **Step 4: Commit**
```bash
git add src/lib/uzmanlar.ts src/lib/puanlar.ts "src/app/uzmanlar/[id]/puan-islemleri.ts"
git commit -m "Puanlama: puan verme ve bekleyen değerlendirme sunucu işlemleri"
```

---

### Task 4: Yıldız gösterimi (kart + profil)

**Files:**
- Create: `src/components/Yildizlar.tsx` (sunucu bileşeni olabilir, durum tutmaz)
- Modify: `src/app/globals.css` (yeni `.yildizlar` bölümü, mevcut "saniyede 18 kare" bölümlerinin yanına)
- Modify: `src/components/UzmanKarti.tsx` (unvan satırının altı)
- Modify: `src/app/uzmanlar/[id]/page.tsx` (başlık bloğunda `uzmanUnvani` satırının altı)

**Interfaces:**
- Consumes: `yildizYuvarla` (Task 1), `Uzman.puan_ortalama`, `Uzman.puan_sayisi` (Task 3).
- Produces: `export function Yildizlar({ ortalama, sayi, boyut }: { ortalama: number; sayi: number; boyut?: number }): JSX.Element`

- [ ] **Step 1: Implement** `Yildizlar`:
  - 5 SVG yıldız çizilir. Path değeri tarayıcı örneğindekiyle aynıdır: `M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z`, `viewBox="0 0 20 20"`.
  - Yarım yıldız için `linearGradient` (%50 dolu) kullanılır. Gradient `id` değeri `useId()` ile benzersiz yapılır, çünkü sayfada birden fazla kart var.
  - Yıldız grubu `aria-hidden` olur. Yanında görünen metin: `<b>4,2</b> (100 değerlendirme)`. Ekran okuyucu metni (`sr-only`): `5 üzerinden 4,2, 100 değerlendirme`.
  - `boyut` varsayılanı 20'dir. Profilde 24 kullanılır.

- [ ] **Step 2: Add CSS.** Değerler tasarımdaki gibidir:
  - `.yildizlar { --kare: calc(1s / 18); }`, `.yildizlar .y { transform-box: fill-box; transform-origin: center; }`
  - İki animasyon:
    - `yildiz-belir`: `calc(var(--kare)*6) steps(6) both`, `scale(.4)`/`opacity .3` → `scale(1)`/`opacity 1`.
    - `yildiz-nefes`: `calc(var(--kare)*36) steps(36) infinite alternate`, `scale(1)` → `scale(.88)`.
  - `nth-child(n)` gecikmeleri:
    - belirme: `(n-1)*4` kare
    - nefes: `22 + (n-1)*7` kare

- [ ] **Step 3: Use it.**
  - `UzmanKarti` ve profilde şart: `uzman.kind === "independent" && uzman.puan_sayisi > 0 && uzman.puan_ortalama !== null`.
  - Şart sağlanmazsa hiçbir şey gösterilmez ("henüz değerlendirme yok" yazısı yok).

- [ ] **Step 4: Check manually.** `npm run dev` çalıştırın, Task 8'deki test verisi yüklü olsun:
  - Puanlı bağımsız uzman kartında yıldızlar önce sırayla belirir, sonra nefes alır.
  - Öğrenci ve puansız kartta yıldız yok.
  - Windows'ta "Animasyon efektleri" kapatılınca yıldızlar durur.
  - `npx tsc --noEmit` ve `npm run lint` temiz çıkar.

- [ ] **Step 5: Commit**
```bash
git add src/components/Yildizlar.tsx src/app/globals.css src/components/UzmanKarti.tsx "src/app/uzmanlar/[id]/page.tsx"
git commit -m "Puanlama: kart ve profilde animasyonlu yıldızlar"
```

---

### Task 5: Puan verme bileşeni ve profildeki form

**Files:**
- Create: `src/components/PuanSecici.tsx` (`"use client"`)
- Create: `src/components/PuanFormu.tsx` (`"use client"`)
- Modify: `src/app/uzmanlar/[id]/page.tsx` (Task 4'teki yıldızların altında yeni bir bölüm)

**Interfaces:**
- Consumes: `puanVer` (Task 3), `danisanPuanDurumu` (Task 3).
- Produces:
  ```ts
  export function PuanSecici({ ad, baslangic }: { ad: string; baslangic?: number | null }): JSX.Element; // name=ad olan radio grubu
  export function PuanFormu({ uzmanId, mevcutPuan, ekDugme, basarida }: {
    uzmanId: string; mevcutPuan?: number | null; ekDugme?: React.ReactNode; basarida?: () => void;
  }): JSX.Element;
  ```

- [ ] **Step 1: Implement** `PuanSecici`:
  - `fieldset` içinde, görünmeyen bir `legend` ("Puan seçin") olur.
  - 5 `input type="radio"` (`value` 1–5) ve her birine bir `label` + 36 px yıldız SVG eklenir.
  - Fare bir yıldızın üstündeyken (`onMouseEnter`) o yıldıza kadar olan yıldızlar dolar. Fare grubun dışına çıkınca (`onMouseLeave`) seçili değere dönülür.
  - Büyütme: `label:hover svg` ve `input:focus-visible + label svg` için `scale(1.3)`, `transition: transform .15s steps(3)`.
  - Odak çerçevesi: `outline: 2px solid #2F5D50`.
  - Altta `aria-live="polite"` olan bir anlam satırı olur. Metinler: `1 · Hiç memnun değilim`, `2 · Memnun değilim`, `3 · Orta`, `4 · Memnunum`, `5 · Çok memnunum`.
  - Seçici yıldızları nefes almaz.

- [ ] **Step 2: Implement** `PuanFormu`:
  - `useActionState(puanVer, {})` kullanılır. Gizli `uzmanId` alanı ve `PuanSecici` vardır.
  - "Gönder" düğmesi ana renk sınıfıyla (`bg-teal-700 text-white`) gösterilir. `ekDugme` bu düğmenin soluna gelir.
  - Hata kırmızı, başarı yeşil ve ✓ ile gösterilir. Projedeki mevcut form mesajı sınıflarıyla aynıdır.
  - `basari` gelince `basarida?.()` çağrılır.

- [ ] **Step 3: Add it to the profile.**
  - Yalnızca giriş yapmış `client` ve `uzman.kind === "independent"` için `danisanPuanDurumu` çağrılır.
  - `puanVerebilir` ise başlığı "Bu uzmanı değerlendirin" olan bir kart içinde `PuanFormu` gösterilir, `mevcutPuan={puanim}`.
  - Daha önce puan verildiyse başlığın altında "Daha önce verdiğiniz puanı değiştirebilirsiniz." yazar.
  - Diğer durumlarda hiçbir şey gösterilmez.

- [ ] **Step 4: Check manually.**
  - 2 seansı olan test danışanıyla puan verin: ✓ mesajı çıkar ve kart ortalaması güncellenir.
  - Puanı değiştirince değerlendirme sayısı artmaz.
  - Tab ve ok tuşlarıyla puan verilebilir, odaktaki yıldız büyür.
  - 1 seansı olan danışan formu görmez.
  - `npx tsc --noEmit` ve `npm run lint` temiz çıkar.

- [ ] **Step 5: Commit**
```bash
git add src/components/PuanSecici.tsx src/components/PuanFormu.tsx "src/app/uzmanlar/[id]/page.tsx"
git commit -m "Puanlama: profilde puan verme formu"
```

---

### Task 6: "Son görüşmeni değerlendir" penceresi

**Files:**
- Create: `src/components/DegerlendirmePenceresi.tsx` (`"use client"`)
- Create: `src/components/DegerlendirmeAlani.tsx` (sunucu bileşeni)
- Modify: `src/app/layout.tsx` (`<main>` öğesinden sonra `<DegerlendirmeAlani kullanici={kullanici} />`)
- Modify: `src/modules/olcek/index.tsx`, `src/modules/olcek/OlcekPenceresi.tsx` (`davetiBastir` prop'u)

**Interfaces:**
- Consumes: `bekleyenDegerlendirme`, `degerlendirmeyiErtele` (Task 3), `PuanFormu` (Task 5), `Kullanici` tipi (`src/lib/oturum.ts`).
- Produces:
  - `DegerlendirmeAlani({ kullanici }: { kullanici: Kullanici | null })`: yalnızca `client` için `bekleyenDegerlendirme` çağırır. Sonuç `null` ise `null` döner.
  - `DegerlendirmePenceresi({ uzmanId, uzmanAdi }: { uzmanId: string; uzmanAdi: string })`
  - `OlcekPenceresi` yeni prop alır: `davetiBastir?: boolean`.

- [ ] **Step 1: Implement** `DegerlendirmePenceresi`. Düzen `OlcekPenceresi` ile aynıdır:
  - Yerel `<dialog>` ve `showModal()` kullanılır. Bu sayede odak tuzağı ve Esc desteği tarayıcıdan gelir.
  - Açılış: mount anında `sessionStorage.getItem("degerlendirme-kapatildi-" + uzmanId)` yoksa açılır. `sessionStorage` erişimi `try/catch` içinde yapılır, hata olursa pencere açılır.
  - Esc veya pencere dışına tıklama (`onCancel` / arka plan tıklaması) yalnızca `sessionStorage` anahtarını yazar ve pencereyi kapatır.
  - "Daha sonra" düğmesi önce `degerlendirmeyiErtele(uzmanId)` çağırır, sonra kapatır.
  - Başlık: `Son görüşmeni değerlendir`.
  - Metin: `{uzmanAdi} ile görüşmeniz nasıldı? Puanınız uzmanın profilinde yalnızca ortalama olarak görünür, adınız görünmez.`
  - İçinde `<PuanFormu uzmanId ekDugme={<Daha sonra düğmesi>} basarida={...} />` bulunur. Başarıdan sonra ✓ mesajı 1,5 saniye gösterilir ve pencere kapanır.

- [ ] **Step 2: Suppress the ölçek invitation.** `OlcekAlani` içinde danışan için `await bekleyenDegerlendirme(kullanici.id)` çağrılır. Sonuç doluysa `<OlcekPenceresi ... davetiBastir />` gönderilir.
  - `OlcekPenceresi` otomatik açılan etkisinde (`useEffect`, ~satır 56) `davetiBastir` ise erken döner ve `localStorage` anahtarını **yazmaz**. Böylece davet sonraki ziyarette yine çıkabilir.
  - Ölçeği elle açma düğmesi etkilenmez.
  - `bekleyenDegerlendirme` `cache()` ile sarılı olduğu için layout ile aynı istekte tek sorgu çalışır.
  - Bu, ölçek modülünden puanlamaya tek yönlü bir bağımlılıktır. Puanlama ölçeğe bağlı değildir.

- [ ] **Step 3: Check manually.** Bu kontrolleri test verisiyle yapın:
  1. 2 seanslı, puanı ve ertelemesi olmayan danışan herhangi bir sayfayı açınca pencere açılır.
  2. Esc → pencere kapanır. Başka sayfaya geçince açılmaz. Tarayıcı kapatılıp açılınca yine açılır.
  3. "Daha sonra" → başka tarayıcıda da bir daha açılmaz.
  4. Gönder → puan kaydedilir, pencere kapanır, bir daha açılmaz.
  5. Pencere açıkken ana sayfada ölçek daveti çıkmaz.
  6. `OLCEK_MODULU_AKTIF=false` iken pencere yine çalışır.
  7. Uzman ve admin hesaplarında pencere hiç açılmaz.
  - `npx tsc --noEmit`, `npm run lint` ve `npm test` temiz çıkar.

- [ ] **Step 4: Commit**
```bash
git add src/components/DegerlendirmePenceresi.tsx src/components/DegerlendirmeAlani.tsx src/app/layout.tsx src/modules/olcek/index.tsx src/modules/olcek/OlcekPenceresi.tsx
git commit -m "Puanlama: son görüşmeni değerlendir penceresi"
```

---

### Task 7: Sıralamayı listelere bağla

**Files:**
- Modify: `src/app/uzmanlar/page.tsx:32` (`karistir(...)` → `puanaGoreSirala(...)`, `karistir` import'u kaldırılır)
- Modify: `src/modules/olcek/puanlama.ts` (`UzmanOzeti` ve `uzmanlariSec`)
- Modify: `src/modules/olcek/index.tsx` (ölçeğe gönderilen özete `puan_ortalama`, `puan_sayisi` eklenir)
- Modify: `scripts/olcek.test.mts` (yardımcı `u()` (~satır 83) yeni alanları `puan_ortalama: null, puan_sayisi: 0` ile doldurur; yeni testler)

**Interfaces:**
- Consumes: `puanaGoreSirala` (Task 1; `import { puanaGoreSirala } from "../../lib/siralama.ts"` puanlama.ts içinde).
- Produces: `UzmanOzeti = { id; kind; display_name; specialties; puan_ortalama: number | null; puan_sayisi: number }`

- [ ] **Step 1: Write the failing tests** in `scripts/olcek.test.mts`:

```ts
test("ölçek: bağımsız uzmanlar puana göre, psikotikler önce", () => {
  const p = (id: string, alanlar: string[], ort: number | null, sayi: number) => ({ ...u(id, "independent", alanlar), puan_ortalama: ort, puan_sayisi: sayi });
  const liste = [p("Pdusuk", ["psikotik"], 4, 2), p("Piyi", ["psikotik"], 4.8, 40), p("Kiyi", ["kaygi"], 4.9, 50)];
  const s = degerlendir(y({ 1: 3, 14: 1 })); // mevcut psikotik testindeki yanıt kalıbı
  assert.deepEqual(uzmanlariSec(liste, s).bagimsiz.map((x) => x.id), ["Piyi", "Pdusuk", "Kiyi"]);
});

test("ölçek: puanlı uzman puansızın önünde, en fazla 3", () => {
  const s = degerlendir(y({ 1: 3 }));
  const liste = [
    ...["A", "B", "C", "D", "E"].map((id) => u(id, "independent", ["kaygi"])),
    { ...u("Puanli", "independent", ["kaygi"]), puan_ortalama: 4.5, puan_sayisi: 20 },
  ];
  for (let i = 0; i < 50; i++) {
    const secim = uzmanlariSec(liste, s).bagimsiz;
    assert.equal(secim.length, 3);
    assert.equal(secim[0].id, "Puanli");
  }
});
```

- [ ] **Step 2: Run** `npm test`. Expected: the new tests FAIL. The old tests run unchanged and their expected values stay the same, because puansız uzmanlar hâlâ rastgele.

- [ ] **Step 3: Implement.** `uzmanlariSec` içindeki `bolum` fonksiyonunda:
  - `karistir(uygun, rastgele)` yerine `puanaGoreSirala(uygun, rastgele)` kullanılır.
  - Psikotikleri öne alan kararlı bölme olduğu gibi kalır.
  - Öğrenci bölümü de `puanaGoreSirala` üzerinden geçer: öğrenciler hep ortada olduğu için sonuç rastgeledir.
  - Kod yorumları güncellenir. "Eşleşen alan sayısı sıralamayı etkilemez" yorumu korunur.

- [ ] **Step 4: Run** `npm test`, `npx tsc --noEmit` and `npm run lint`. Expected: all PASS.
  - Elle kontrol: `/uzmanlar` sayfasında puanlı uzmanlar üstte, düşük puanlı uzman en altta.
  - Sayfa yenilenince yalnızca orta bölümün sırası değişir.

- [ ] **Step 5: Commit**
```bash
git add src/app/uzmanlar/page.tsx src/modules/olcek/puanlama.ts src/modules/olcek/index.tsx scripts/olcek.test.mts
git commit -m "Puanlama: uzman listesi ve ölçek sonucu puana göre sıralanır"
```

---

### Task 8: Test verisi, kurallar ve metinler

**Files:**
- Modify: `scripts/test-verisi.mts`
- Modify: `CLAUDE.md` (§6 son madde)
- Modify: `src/lib/karistir.ts:1` (yorum)
- Modify: `YAYIN-ONCESI.md`
- Modify: `src/app/kullanim-kosullari/page.tsx`, `src/app/gizlilik/page.tsx`, `src/app/sss/page.tsx`

- [ ] **Step 1: Test data.** Bağımsız test uzmanlarına gizli anahtarla doğrudan `expert_ratings` satırı eklenir. Danışan bağı yoktur, `client_id: null`; silinmiş danışan puanı gibi davranır. Dağılım:
  - bir uzman 30 × ortalama ~4,5
  - bir uzman 1 × 5
  - bir uzman 5 × 1 (alt bölüm)
  - kalanlar puansız

  Ek olarak:
  - Bir test danışanı ile bir bağımsız uzman arasında, geçmiş tarihli, `confirmed`, `price_kurus` dolu **2** seans kaydı (`session_offers`) oluşturulur. Bu kayıt mevcut sohbet/başvuru kayıtlarına bağlanır. Betikte uygun bir konuşma yoksa betiğin mevcut düzeniyle bir başvuru ve konuşma oluşturulur.
  - Betik tekrar çalıştırılabilir kalmalı: önce eski test puanlarını ve seanslarını silin.
  - Betiğin sonundaki özete şu satır eklenir: "Puan penceresi için: <danışan e-postası> ile giriş yapın."

- [ ] **Step 2: Rules and texts.**
  - `CLAUDE.md` §6 son maddedeki şu cümle değiştirilir: "Uzmanlar arasında eşit rekabet: ölçek sonucu ve /uzmanlar listesi rastgele sıralanır (src/lib/karistir.ts); eşleşen alan sayısı sıralamayı etkilemez."
  - Yerine yeni bir madde eklenir: "Uzman puanlama (kullanıcı kararı, 2026-11-08; 0020; tasarım: `docs/superpowers/specs/2026-11-08-uzman-puanlama-design.md`): danışan, bağımsız uzmana en az 2 tamamlanmış seanstan sonra 1–5 yıldız verir; yorum yok; öğrenci uzmanlar puanlanmaz. Sıralama `src/lib/siralama.ts` (ağırlıklı puan, C=5, m=3,5; 2,5 altı puansızların altına iner); puansız uzmanlar ve öğrenciler rastgele; eşleşen alan sayısı sıralamayı etkilemez. Puan satırlarını kimse okuyamaz, yalnızca özet herkese açık. Danışan hesabını silince puan anonim kalır. 'Seans yapılmadı' bildirimi sayılan seansı 2'nin altına düşürürse puan silinir."
  - `karistir.ts` yorumu: "Puansız uzmanlar ve öğrenci uzmanlar için liste karıştırılır (Fisher-Yates); sıralama kuralı src/lib/siralama.ts."
  - `YAYIN-ONCESI.md` → "Güvenlik" başlığı altına eklenecek madde: "[ ] Uzman puanlama: ödeme demo olduğu için iki sahte seansla puan verilebilir. Gerçek ödemeyle birlikte puan şartı yeniden değerlendirilmeli."
  - Yasal sayfalar `YasalSayfa` çerçevesindeki taslak düzenine uygun kısa bölümler alır:
    - Kullanım koşulları: kim puan verebilir.
    - Gizlilik: puan anonim gösterilir; hesap silinince danışanla bağı kopar, puan kalır.
    - SSS: "Uzmanlar nasıl sıralanıyor?" sorusu. Cevap ağırlıklı puanı ve puansızların rastgele sıralandığını sade dille anlatır.

- [ ] **Step 3: Run** `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`. Expected: all PASS.

- [ ] **Step 4: Commit**
```bash
git add scripts/test-verisi.mts CLAUDE.md src/lib/karistir.ts YAYIN-ONCESI.md src/app/kullanim-kosullari/page.tsx src/app/gizlilik/page.tsx src/app/sss/page.tsx
git commit -m "Puanlama: test verisi, proje kuralları ve taslak metinler"
```
