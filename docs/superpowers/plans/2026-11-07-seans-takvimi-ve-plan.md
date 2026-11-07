# Seans takvimi, plan ve grup seansları: uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Danışan uzmanın müsait saatine başvurur, her seans tarih ve saat taşıyan bir planla kesinleşir, demo ödeme korumalı tutulur, ardından grup seansları eklenir.

**Architecture:** Kurallar veritabanı fonksiyonlarındadır, yalnızca sunucu (`service_role`) çağırır. Saat çakışmasını tek bir `exclude` kısıtı engeller. Ödeme, ayrı migration ve `src/modules/odeme/` içinde durur ve seans tablosuna yalnızca tetikleyiciyle (trigger) bağlanır.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, Supabase (Postgres, RLS, pg_cron), `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-07-seans-takvimi-ve-plan-design.md`

## Global Constraints

- Tüm arayüz metni Türkçe. Tarih `17.11.2026`, saat `14:30`, para `₺`, saat dilimi `Europe/Istanbul`.
- Kod yazmadan önce ilgili sayfa için `node_modules/next/dist/docs/` okunur.
- Yeni bağımlılık yok. Her yeni tabloda RLS açık. Kullanıcılara yeni tablolara yazma izni yok.
- Migration'lar tekrar çalıştırılabilir (`if not exists`, `drop ... if exists`, `create or replace`).
- Saat kutusu 08:00-21:00 başlangıç, 4 hafta ileri. Süre 30, 45, 50, 60, 90, 120. Ücret 1-10.000 tam TL. Komisyon %5. Plan süresi 24 saat. Bekletme seans bitimi + 48 saat. Grup 3-12 kişi, son katılım 12 saat kala.
- Öğrenci uzman ekranında ücret, ödeme, komisyon ve grup seçeneği görünmez.
- `ODEME_MODULU_AKTIF` yoksa kapalıdır. Kapalıyken ödeme izi kalmaz.
- Admin'e seans tablosunda genel okuma yetkisi verilmez. `'unsafe-inline'` eklenmez, CSP değişmez.
- **Commit yalnızca aşama sonunda (kullanıcı kararı):** bireysel aşama bir commit, grup aşaması bir commit.

## Review Focus

1. Aynı anda gönderilen iki plan veya süresi dolmuş planla aynı saate yeni plan: birincide yalnızca biri geçer, ikincide yeni plan geçer. Task 2'nin SQL denetim betiğinde sınanır.
2. Yönetici, "Seans yapılmadı" işaretini genel "İncelemeyi kapat" düğmesiyle kapatır: ödeme "incelemede" kalmamalı. `isaret_kapat` bu kategoride hata verir ve düğme gizlenir (Task 6).
3. Danışanın zaten açık bir şikayeti varken "Seans yapılmadı"ya basması: `conversation_flags_tek_sikayet` engellememeli (Task 6).
4. Aynı sohbette tekrar eden otomatik işaret: IBAN yazan her mesajda yeni kayıt açılmamalı, tek açık kayıt kalmalı (Task 7).
5. Yaz saati veya UTC sunucusunda tarih kayması: `10.11.2026 14:00` her ortamda aynı ana denk gelmeli (Task 1 testi).

---

## Aşama 1: Bireysel

### Task 1: Saf kurallar

**Files:** Create `src/lib/seans-kurallari.ts`, `scripts/seans-kurallari.test.mts`. Modify `package.json` (`"test": "node --test scripts/*.test.mts"`).

**Interfaces (hiçbir şey içe aktarmaz):**
- `SEANS_SURELERI`, `SAAT_ILK = 8`, `SAAT_SON = 21`, `GORUNEN_HAFTA = 4`, `UCRET_EN_AZ = 1`, `UCRET_EN_FAZLA = 10000`
- `saatIso(tarih: string, saat: number): string` — `saatIso("2026-11-10", 14)` = `"2026-11-10T11:00:00.000Z"`
- `haftaGunleri(hafta: number, simdi: Date): { tarih: string; etiket: string; gun: number }[]` — Pazartesiden başlayan 7 gün, Türkiye tarihine göre. `gun` 1-7.
- `ucretGecerli(deger: string): number | null` — tam TL ise sayı, değilse null.
- `komisyon(kurus: number): { komisyon: number; uzmanaKalan: number }`
- `iptalIadeli(iptalEden: "client" | "expert", baslangic: string, simdi: Date): boolean`
- `odemeKalibiVar(metin: string): boolean` — TR IBAN (boşluklu dahil), Türkiye cep/sabit telefon (`05xx`, `+90 5xx`, boşluk/tire/nokta).

- [ ] **Step 1: Testi yaz** (`node:test`, `node:assert`). Doğrulananlar: `saatIso` örneği; `komisyon(120000)` = `{6000, 114000}`; `ucretGecerli("0")`, `("10001")`, `("12.5")`, `("abc")` null, `("1200")` 1200; `iptalIadeli` tablo: 25 saat kala client true, 23 saat client false, 23 saat expert true; `odemeKalibiVar`: `TR33 0006 1005 1978 6457 8413 26` true, `0532 123 45 67` true, `+90 532 123 4567` true, `Saat 14:00'te görüşelim` false, `2026 yılında 50 dakika` false.
- [ ] **Step 2:** `npm test` çalıştır, modül yok diye FAIL gör.
- [ ] **Step 3:** Fonksiyonları yaz. `saatIso` sabit `+03:00` kullanır, üstüne `shortcut:` yorumu: Türkiye yaz saati uygulamıyor, değişirse güncellenmeli.
- [ ] **Step 4:** `npm test` PASS.

### Task 2: Migration 0016 (seans çekirdeği)

**Files:** Create `supabase/migrations/0016_seans_takvimi.sql`, `supabase/denetim/0016_denetim.sql` (Supabase SQL Editor'de elle çalışan, `rollback` ile biten denetim).

**Şema:**
- `expert_profiles`: `offers_online boolean not null default true`, `offers_in_person boolean not null default false`, `city text`, `district text`, `session_minutes int` (liste kontrolü). Kısıtlar: online veya yüz yüze; yüz yüze ise şehir ve ilçe dolu. `uzman_vitrini` sonuna bu sütunlar eklenir.
- `expert_availability(expert_id, weekday 1-7, hour 8-21, pk)`, cascade. RLS: sahibi okur. Herkese açık okuma yok.
- `applications`: `requested_start timestamptz`, `availability` boş olabilir. Yeni kayıtta tetikleyici: `requested_start` zorunlu, `uzman_musait_saatler` içinde olmalı, değilse `SAAT_UYGUN_DEGIL`.
- `session_offers`: `id`, `conversation_id` (cascade), `expert_id` (set null), `client_id` (cascade), `starts_at`, `ends_at`, `price_kurus` (100-1000000 veya null), `status` (`sent, awaiting_payment, confirmed, rejected, withdrawn, expired, cancelled`), `expires_at`, `meeting_url` (`https://`, ≤300), `cancelled_at`, `cancelled_by` (`client, expert, system`), `created_at`. `exclude using gist (expert_id with =, tstzrange(starts_at, ends_at) with &&) where (status in ('sent','awaiting_payment','confirmed'))`. RLS: iki taraf okur.

**Fonksiyonlar (yalnızca `service_role`, ilk parametreler sunucunun doğruladığı kullanıcı):**
- `uzman_musait_saatler(p_uzman uuid, p_bas timestamptz, p_bit timestamptz) returns setof timestamptz` — istisna: `anon, authenticated` çağırır; yalnızca vitrindeki uzman için ve yalnızca saat döndürür. Kendi süresiyle etkin aralığa çakışan, geçmiş, 4 haftadan ileri olan saatler çıkar. Süresi geçmiş `sent` ve `awaiting_payment` boş sayılır.
- `basvuru_kabul(p_basvuru, p_uzman, p_sarili_anahtar) returns uuid` — Kabul ve sohbet tek işlemde. Öğrenci ise `confirmed` seans da açar, çakışma veya geçmiş saatte `SAAT_DOLU`.
- `plan_gonder(p_konusma, p_uzman, p_baslangic, p_ucret_kurus) returns uuid` — Önce süresi dolanları `expired` yapar. Onay, tür (bağımsız: ücret zorunlu, öğrenci: ücret null), saat başı, 08-21, gelecek, 4 hafta, 24 saatte en fazla 20 plan denetler. `expires_at = least(now()+24h, baslangic)`. `23P01` → `SAAT_DOLU`.
- `plan_yanitla(p_plan, p_danisan, p_karar, p_odeme_aktif)` — `onay`: öğrenci veya ödeme kapalı → `confirmed`, diğer → `awaiting_payment`. `ret`: `rejected`. Süresi geçmişse `SURE_DOLDU`.
- `plan_geri_cek(p_plan, p_uzman)` — yalnızca `sent`.
- `seans_iptal(p_plan, p_kullanici)` — `confirmed`, başlamamış; `cancelled_by` yazar.
- `uzman_seanslarini_kapat(p_uzman)` — bekleyenler `expired`, gelecek `confirmed` kayıtlar `cancelled`/`system`, gelecek bağlantılar silinir. `expert_profiles` üzerinde iki tetikleyici çağırır: onay kalkınca, silmeden önce.
- `seans_bakimi()` — süresi dolanları kapatır, `verified_until` geçenler için kapatma yapar, 12 aydan eski seansları siler. `pg_cron` saatte bir.
- Tetikleyici: `conversations.meeting_url` doluyken değiştirilemez (`BAGLANTI_DEGISTIRILEMEZ`), `expert_id` boşalırken serbest.

- [ ] **Step 1:** `0016_denetim.sql` yaz: uydurma satırlarla, `do $$` içinde `assert`: 14:00/50 dk varken 14:30 `SAAT_DOLU`; süresi geçmiş planın saati yeni plana açık; 90 dk seans 14 ve 15'i `uzman_musait_saatler`dan çıkarır; öğrenciye ücretli plan reddedilir; 10.001 TL reddedilir; ikinci `meeting_url` reddedilir; `uzman_vitrini` dışındaki uzman için boş döner. Son satır `rollback`.
- [ ] **Step 2:** Migration'ı yaz, `grant`/`revoke` listesini ve RLS'yi 0013 düzeninde ekle.
- [ ] **Step 3:** SQL'in sözdizimini kullanıcının Supabase'i olmadan çalıştıramayacağımızı plan sonunda kullanıcıya bildir: çalıştırılacak dosya sırası `0016`, `0017`, denetim.

### Task 3: Uzman paneli (görüşme bilgileri, haftalık tablo)

**Files:** Create `src/app/panel/GorusmeBilgileriFormu.tsx`, `src/app/panel/HaftalikTablo.tsx`, `src/lib/iller.ts` (81 il). Modify `src/app/panel/islemler.ts`, `src/app/panel/page.tsx`, `src/lib/uzmanlar.ts` (`ALANLAR_SORGU`, `Uzman` tipi).

**Interfaces:** `gorusmeBilgileriKaydet(FormDurumu, FormData)`, `haftalikDuzenKaydet(FormDurumu, FormData)` (kutu değeri `"gun-saat"`, tümü silinip yeniden yazılır). `Uzman` tipine `offers_online`, `offers_in_person`, `city`, `district`, `session_minutes` eklenir.

- [ ] **Step 1:** İşlemleri `profilGuncelle` düzeninde yaz. İlçe `^[\p{L} ]{1,40}$`. Yüz yüze ise il listeden.
- [ ] **Step 2:** Formları yaz, panelde "Profil bilgilerim" altına ekle. Kutular `aria-pressed` düğmesi, gönderim gizli alanla.
- [ ] **Step 3:** `npm run lint` ve `npx tsc --noEmit` temiz.

### Task 4: Profil, takvim, başvuru, bulut ve güneş

**Files:** Create `src/app/uzmanlar/[id]/Takvim.tsx`, `src/components/BulutGunes.tsx`. Modify `src/app/uzmanlar/[id]/page.tsx`, `BasvuruFormu.tsx`, `islemler.ts`, `src/app/globals.css`, `src/app/panel/page.tsx`, `src/app/panel/islemler.ts`, `src/lib/sabitler.ts`. Create `src/app/panel/BasvuruYanitFormu.tsx`.

- [ ] **Step 1:** Profil: görüşme şekli, süre, "Bireysel" etiketi, "Yüz yüze görüşme: Kadıköy, İstanbul" ve uyarısı: "Yüz yüze görüşme ve ödeme site dışındadır, iade ve koruma kapsamında değildir" + `<OnayGerekir />`.
- [ ] **Step 2:** `Takvim` (istemci): gri kutuda saat, boş yerde kutu yok, seçili koyu adaçayı, 4 hafta gezinme, `aria-label` tam tarih, kart içinde yana kayma. Saatleri sayfa `uzman_musait_saatler` ile sunucuda okuyup verir. Giriş yoksa düğme yerine mevcut giriş/kayıt yazısı. Süre veya saat yoksa "Uzman henüz uygun saat belirtmedi". Yalnızca yüz yüze ise spec'teki metin ve takvim/başvuru yok.
- [ ] **Step 3:** `BasvuruFormu` saat alanını `Takvim`'den alır, "Bu saat bir istektir, kesin saati uzman plana yazar" yazar (öğrenci uzmanda "uzman onaylarsa saat kesinleşir"). `basvuruYap` `requested_start` yazar, `SAAT_UYGUN_DEGIL` için Türkçe hata. `UYGUN_ZAMANLAR` yalnızca eski başvuruları göstermek için kalır.
- [ ] **Step 4:** Panel başvuru satırı istenen saati gösterir. `BasvuruYanitFormu` + `basvuruYanitla` artık `basvuru_kabul` çağırır ve `SAAT_DOLU` mesajı gösterir.
- [ ] **Step 5:** `BulutGunes` (`aria-hidden`), yalnızca profilde takvim altında. CSS 18 kare düzeninde.
- [ ] **Step 6:** `npm run lint`, `npx tsc --noEmit` temiz.

### Task 5: Sohbet kartları ve bağlantılar

**Files:** Create `src/lib/seanslar.ts`, `src/app/mesajlar/[id]/SeansKartlari.tsx`, `PlanFormu.tsx`, `seans-islemleri.ts`. Modify `src/app/mesajlar/[id]/page.tsx`, `islemler.ts`, `GorusmeBaglantisiFormu.tsx`, `src/components/OdemeUyarisi.tsx`, `src/lib/bildirimler.ts`, `src/app/on-gorusme/page.tsx`.

**Interfaces:** `seanslariGetir(konusmaId): Promise<Seans[]>`. İşlemler: `planGonder`, `planYanitla`, `planGeriCek`, `seansIptal`, `seansBaglantisiKaydet`, hepsi `(FormDurumu, FormData)` ve `konusmaGetir` ile taraf denetimi yapar.

- [ ] **Step 1:** Kartlar: tarih, saat, süre, ücret (öğrencide yok), durum, koruma vurgusu "Site içi ödemede saat güvencesi ve iade hakkınız vardır" (yalnızca bağımsız ve modül açık). Danışan: onayla/reddet, iptal. Uzman: geri çek, iptal, bağlantı ekle. "Görüşmeye katıl" yalnızca `confirmed` + bağlantı varsa. İptal düğmesinin yanında `iptalIadeli` sonucu yazılır, `<OnayGerekir />` ile.
- [ ] **Step 2:** Ön görüşme: form yalnızca `offers_free_intro` açık bağımsız uzmanda ve `meeting_url` boşken. Danışan görünümü ilk `confirmed` seanstan sonra gizlenir. `gorusmeBaglantisiKaydet` boş değer ve ikinci kaydı reddeder.
- [ ] **Step 3:** `bildirimSayilari`: danışan için `sent` plan sayısı mesaj sayısına eklenir. `OdemeUyarisi` "yakında" cümlesini modül açıkken gizler. `/on-gorusme` metni güncellenir.
- [ ] **Step 4:** `npm run lint`, `npx tsc --noEmit` temiz.

### Task 6: Demo ödeme, bekletme, yönetici kararı

**Files:** Create `supabase/migrations/0017_demo_odeme.sql`, `src/modules/odeme/ayar.ts`, `src/modules/odeme/islemler.ts`, `src/modules/odeme/OdemeAdimi.tsx`, `src/modules/odeme/SeansYapilmadi.tsx`, `src/app/admin/incelemeler/SeansKarari.tsx`. Modify `SeansKartlari.tsx`, `src/app/admin/incelemeler/page.tsx`, `islemler.ts`, `.env.example`, `0017` içinde `admin_audit_log` eylem listesi (önce `0010`'u oku).

**Şema:** `demo_payments(session_offer_id pk, cascade, amount_kurus, commission_kurus, expert_net_kurus, status held|in_review|transferred|refunded, paid_at, settled_at)`. RLS: iki taraf okur. `conversation_flags`: `session_offer_id` sütunu, kategoriler `seans_yapilmadi`, `site_disi_odeme`; kullanıcı politikası `site_disi_odeme`'yi de kabul eder; `conversation_flags_tek_sikayet` `seans_yapilmadi` kategorisini dışlar; açık işaret için `session_offer_id` üzerinde benzersizlik.

**Fonksiyonlar:** `demo_odeme_yap(p_plan, p_danisan)` (`awaiting_payment` → `confirmed`, `held`, komisyon SQL'de %5 yuvarlamalı). Tetikleyici: `cancelled` olunca `held` → iade kuralına göre `refunded` veya `transferred`. `seans_yapilmadi_bildir(p_plan, p_danisan)`: `held`, başlamış, bitiş + 48 saat içinde; `in_review` + işaret. `admin_seans_karti(p_isaret)`: yalnız admin (`my_role`), tarih, süre, tutar, durum, `baglanti_var boolean`, adres yok. `seans_karari(p_isaret, p_karar, p_sebep)`: ödeme kapanır, işaret kapanır, `admin_audit_log` yazılır. `isaret_kapat` bu kategoride `KARAR_GEREKLI`. `seans_bakimi` süresi dolan `held` → `transferred`; `pg_cron` zamanlaması aynı kalır. Uzman silinirken `held` → `refunded`.

- [ ] **Step 1:** `0017_denetim.sql`: geç iptal danışan → `transferred`, geç iptal uzman → `refunded`, 48 saat sonra `transferred`, `in_review` bakımda değişmez, admin dışı `seans_karari` reddedilir, açık şikayet varken bildirim geçer.
- [ ] **Step 2:** Migration'ı yaz.
- [ ] **Step 3:** Modül: `odemeModuluAktif()`, "Bu bir demodur, para çekilmez", kart alanı yok, kapalıyken `null`. Yalnızca `SeansKartlari.tsx` modülü içe aktarır.
- [ ] **Step 4:** Yönetici: `seans_yapilmadi` işaretlerinde genel kapatma düğmesi yok, `SeansKarari` var. Yetki `adminKullanici()`.
- [ ] **Step 5:** `npm run lint`, `npx tsc --noEmit`, ayrıca `.env.local` değeri `false` iken `npm run build`.

### Task 7: Site dışı yönlendirme, metinler, belgeler, aşama commit'i

**Files:** Modify `src/app/mesajlar/[id]/islemler.ts`, `SikayetFormu.tsx`, `page.tsx`, `src/lib/sabitler.ts`, `src/components/kvkk/Metinler.tsx`, `src/app/gizlilik/page.tsx`, `src/app/kullanim-kosullari/page.tsx`, `scripts/test-verisi.mts`, `README.md`, `YAYIN-ONCESI.md`, `CLAUDE.md`. Migration `0017`: açık `auto_moderation` işaret için sohbet başına benzersizlik.

- [ ] **Step 1:** `mesajGonder`: gönderen bağımsız uzman ise `odemeKalibiVar`, mesaj kaydından sonra işaret eklenir (`source='auto_moderation'`, `category='site_disi_odeme'`, `detector='odeme_kaliplari_v1'`, `message_id`). Hata mesajı bozmaz, içerik log'lanmaz. Mesaj kaydı id döndürür.
- [ ] **Step 2:** `SIKAYET_KATEGORILERI`'ne `site_disi_odeme: "Site dışına ödeme yönlendirmesi"`. Form ve `sikayetEt` öğrenci sohbetinde bunu reddeder.
- [ ] **Step 3:** KVKK metinleri ve onay ekranı otomatik kontrolü, seans verisini, saklamayı anlatır. `KVKK_SURUMU`, `ACIK_RIZA_SURUMU`, `YASAL_METIN_TARIHI` yükselir. İptal/iade cümlelerinde `<OnayGerekir />`.
- [ ] **Step 4:** `test-verisi.mts`, `.env.example`, `README.md` (migration sırası), `YAYIN-ONCESI.md` (gerçek ödeme kuruluşu, yasal saklama, regex tarama gözden geçirme), `CLAUDE.md` (yeni kararlar; "Mesajları yalnızca iki taraf okur" notuna otomatik kalıp kontrolü).
- [ ] **Step 5:** `npm test`, `npm run lint`, `npm run build` geçer. Mümkünse `run` becerisiyle uygulama denenir.
- [ ] **Step 6: Commit (kullanıcının istediği aşama commit'i)**

```bash
git add -A
git commit -m "Seans takvimi, plan, demo ödeme ve yönetici kararı"
```

---

## Aşama 2: Grup

### Task 8: Migration 0018

**Files:** Create `supabase/migrations/0018_grup_seanslari.sql`, `supabase/denetim/0018_denetim.sql`.

**Şema:** `session_offers.conversation_id` ve `client_id` boş olabilir, `group_session_id` eklenir (takvimi aynı `exclude` korur). `group_sessions(id, expert_id, topic, purpose ≤500, purpose_needs_review, starts_at, ends_at, price_kurus, status open|cancelled, meeting_url, created_at)`. `group_participants(group_session_id, client_id, status paid|cancelled, joined_at, unique)`. `demo_payments`'a `group_participant_id`, `conversation_flags`'a sohbetsiz grup işareti. RLS: katılımcı bağlantıyı yalnızca kendi seansında okur, ad yalnızca uzmana. Herkese açık okuma bağlantısız görünümle.

**Fonksiyonlar:** `grup_ac` (yalnız `independent`), `grup_katil` (kilitle, en fazla 12, son katılım 12 saat, önce ödeme, KVKK onayı), `grup_ayril` (iptal tablosu, son katılımdan sonra 3 altı → herkese iptal ve iade, ayrılan kişi kurala tabi), `seans_bakimi`'ne 12 saat kala 3 altı iptal.

- [ ] **Step 1:** Denetim: 13. kişi reddedilir, öğrenci `grup_ac` reddedilir, 12 saat kala 2 kişi → iptal ve iade, son katılımdan sonra ayrılma 3 altı → herkese iptal, grup saati bireysel plana kapalı.
- [ ] **Step 2:** Migration'ı yaz.

### Task 9: Grup arayüzü ve aşama commit'i

**Files:** Create `src/app/grup-seanslari/page.tsx`, `src/app/grup-seanslari/[id]/page.tsx`, `islemler.ts`, `src/app/panel/GrupSeansFormu.tsx`. Modify `UstMenu.tsx`, `src/app/uzmanlar/[id]/page.tsx` (grup etiketi), `src/app/panel/page.tsx`, `src/app/admin/page.tsx` (amaç sonradan kontrol), `src/app/admin/incelemeler/page.tsx`, yasal metinler, `CLAUDE.md`, `README.md`, `scripts/test-verisi.mts`.

- [ ] **Step 1:** Uzman formu ve listesi (katılımcı adları yalnız burada). Öğrenci panelinde form yok.
- [ ] **Step 2:** Liste ve ayrıntı sayfası: amaç, konu, tarih, ücret, kalan kontenjan sayısı. Katılımda KVKK onayı, ardından demo ödeme, ödeme kapalıysa doğrudan yer.
- [ ] **Step 3:** `npm test`, `npm run lint`, `npm run build` geçer.
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Grup seansları"
```
