# Uzmanlar ve Öğrenci Uzmanların Ayrılması: Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bağımsız uzmanlar ile öğrenci uzmanları ayrı sayfalara ayırmak, kabul kurallarını daraltmak ve ciddi durumu olan danışanın öğrenci uzmana başvurmasını engellemek.

**Architecture:** Tek bir `UzmanListesi` sunucu bileşeni `tur` değerine göre iki sayfayı çizer. Saf kurallar test edilebilsin diye `src/lib/sabitler.ts` ve `psikolojik-rahatsizliklar/kurallar.ts` içinde durur. Eski hesaplar SQL ile değil, dosyaları da temizleyen bir betikle silinir; migration eski hesap kaldıysa durur.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, Supabase, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-08-uzman-ogrenci-ayrimi-design.md`

## Global Constraints

- Arayüz metinleri Türkçe. Kod içi yorumlar ASCII Türkçe (mevcut dosyalardaki gibi).
- Unvanlar: `psikolog`, `psikolojik_danisman`. Bölümler: `pdr`, `klinik_psikoloji_yl`.
- Staj veya kabul kuralı iddiasının yanında `<OnayGerekir />` kalır.
- Öğrenci uzmanlar için ücret, fiyat, "uygun fiyatlı" ifadesi eklenmez.
- Ciddi durum yanıtı kaydedilmez, loglanmaz, uzmana gösterilmez.
- Betik çıktısına ad veya e-posta yazılmaz.
- Testler `npm test` ile çalışır. Test dosyaları `../src/...ts` yolunu uzantısıyla içe aktarır, `@/` kullanamaz.
- `npm run lint` ve `npm run build` her görevin sonunda hatasız geçer.
- Next.js 16 kuralları için `AGENTS.md` ve `node_modules/next/dist/docs/` okunur.
- Her commit mesajı `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` satırıyla biter.
- Çalışma `master` üzerinde yapılmaz, `uzman-ogrenci-ayrimi` dalı açılır.

## Review Focus

1. Öğrenci sayfasına `?alan=psikotik` yazılırsa kapalı alan filtre gibi çalışmaz, tüm öğrenciler listelenir (Görev 3 testi).
2. Yanıtsız veya kurcalanmış başvuru öğrenci uzmana ulaşamaz; bağımsız uzman başvurusu bu sorudan etkilenmez (Görev 4 testi).
3. Açık şikayeti olan eski hesap silinmez, atlanır (Görev 2 testi).
4. `--onay` verilmeden betik hiçbir şey silmez; dosya silinemezse hesaba dokunulmaz (Görev 2 testi ve elle kontrol).
5. Ciddi kartlardan Öğrenci Uzmanlar bağlantısı çıkmaz (Görev 5 testi).

---

### Task 1: Kabul kuralları ve veritabanı

**Files:**
- Modify: `src/lib/sabitler.ts:48-60`
- Modify: `src/lib/uzmanlar.ts:96-101`
- Modify: `src/app/kayit/KayitFormu.tsx:15,91-100`
- Modify: `src/app/kayit/islemler.ts:47`
- Modify: `scripts/test-verisi.mts:40,66,74,76,84`
- Create: `supabase/migrations/0021_uzman_ogrenci_ayrimi.sql`
- Create: `supabase/denetim/0021_denetim.sql`
- Test: `scripts/uzman-siniflari.test.mts`

**Interfaces:**
- Produces: `UNVANLAR`, `BOLUMLER`, `Unvan`, `Bolum` yeni değerleriyle.

- [ ] **Adım 1: `master` üzerindeyse dalı aç**

Çalıştır: `git switch -c uzman-ogrenci-ayrimi`

- [ ] **Adım 2: Başarısız testi yaz**

```ts
test("yalnızca iki unvan kabul edilir", () => {
  assert.deepEqual(UNVANLAR, { psikolog: "Psikolog", psikolojik_danisman: "Psikolojik Danışman" });
});
test("yalnızca iki öğrenci grubu kabul edilir", () => {
  assert.deepEqual(BOLUMLER, { pdr: "PDR 4. sınıf", klinik_psikoloji_yl: "Klinik Psikoloji Yüksek Lisans" });
});
```

- [ ] **Adım 3: `npm test` çalıştır**

Beklenen: bu iki test FAIL.

- [ ] **Adım 4: Sabitleri ve etiketi değiştir**

`UNVANLAR` ve `BOLUMLER` testteki değerler olur. `uzmanUnvani` öğrenci için `Stajyer · ${BOLUMLER[uzman.department]}` döndürür.

- [ ] **Adım 5: Kayıt metinlerini değiştir**

Rol açıklaması: `PDR 4. sınıf veya Klinik Psikoloji yüksek lisans öğrencisiyim, ücretsiz ve staj kapsamında görüşme yapacağım.`

Onay kutusu `PDR 4. sınıf veya Klinik Psikoloji yüksek lisans öğrencisiyim.` ile başlar, gerisi aynı kalır. `name="sonSinif"` ve `final_year` değişmez.

Hata metni: `Öğrenci uzman olarak yalnızca PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencileri staj kapsamında katılabilir.`

- [ ] **Adım 6: Test verisini değiştir**

Ayla `psikolog`, Murat `psikolojik_danisman`. Ece `klinik_psikoloji_yl`, tanıtımı `Uydurma test profili. Klinik Psikoloji yüksek lisans öğrencisi. Görüşmeler ücretsiz, staj kapsamında.` Can'ın tanıtımı `Uydurma test profili. PDR 4. sınıf öğrencisi. Görüşmeler ücretsiz, staj kapsamında.`

- [ ] **Adım 7: Migration'ı yaz**

Spec'teki sırayla: `department = 'psikoloji'` satırı varsa `raise exception 'ESKI_PSIKOLOJI_HESAPLARI_SILINMEDI'`, unvanları dönüştür, `expert_profiles` üzerindeki `title` ve `department` kısıtlarını adlarını `pg_constraint` içinden bulup bırak ve yeni listelerle ekle. 0001'deki kısıtlar adsız yazıldı, varsayılan adlar `expert_profiles_title_check` ve `expert_profiles_department_check` olmalı; migration'dan önce doğrula.

- [ ] **Adım 8: Denetim dosyasını yaz**

`supabase/denetim/0019_denetim.sql` kalıbıyla, sonunda geri alan bir işlem: `klinik_psikolog` unvanı ve `psikoloji` bölümü eklemeleri kısıta takılır, `klinik_psikoloji_yl` bölümü kabul edilir.

- [ ] **Adım 9: Doğrula**

Çalıştır: `npm test`, `npm run lint`, `npm run build`. Beklenen: hepsi hatasız.

- [ ] **Adım 10: Commit**

`Kabul kuralları: iki unvan, iki öğrenci grubu`

### Task 2: Eski Psikoloji lisans hesaplarını silen betik

**Files:**
- Create: `scripts/eski-psikoloji-kurali.mts`
- Create: `scripts/eski-psikoloji-hesaplarini-sil.mts`
- Modify: `package.json` (`"eski-hesaplari-sil": "node --env-file=.env.local scripts/eski-psikoloji-hesaplarini-sil.mts"`)
- Test: `scripts/eski-psikoloji-kurali.test.mts`

**Interfaces:**
- Produces: `silinecekleriAyir(hesaplar: string[], sohbetler: { id: string; expert_id: string }[], acikIsaretler: { conversation_id: string }[]): { silinecek: string[]; atlanan: string[] }`

- [ ] **Adım 1: Başarısız testi yaz**

```ts
test("açık şikayeti olan hesap atlanır", () => {
  const sonuc = silinecekleriAyir(["a", "b"], [{ id: "s1", expert_id: "a" }, { id: "s2", expert_id: "b" }], [{ conversation_id: "s2" }]);
  assert.deepEqual(sonuc, { silinecek: ["a"], atlanan: ["b"] });
});
test("sohbeti olmayan hesap silinir", () => {
  assert.deepEqual(silinecekleriAyir(["a"], [], []), { silinecek: ["a"], atlanan: [] });
});
```

- [ ] **Adım 2: `npm test` çalıştır**

Beklenen: FAIL, dosya yok.

- [ ] **Adım 3: `silinecekleriAyir` fonksiyonunu yaz**

- [ ] **Adım 4: `npm test` çalıştır**

Beklenen: PASS.

- [ ] **Adım 5: Betiği yaz**

`scripts/test-verisi.mts` ile aynı ayar kontrolü ve istemci. Sıra:

1. `expert_profiles` içinden `kind = 'student'` ve `department = 'psikoloji'` kimliklerini al.
2. Bu kimliklerin `conversations` satırlarını ve `status = 'open'` olan `conversation_flags` satırlarını al, `silinecekleriAyir` çağır. Sorgu hatasında çık, hiçbir şey silme.
3. `Silinecek: N, atlanan: M` yaz.
4. `process.argv` içinde `--onay` yoksa dur.
5. Her hesap için `uzman-belgeleri` ve `profil-fotograflari` depolarında `hesap-islemleri.ts` ile aynı yolla dosyaları sil, sonra `auth.admin.deleteUser`. Dosya silme hatasında o hesaba dokunma, hata sayacını artır, sonraki hesaba geç.
6. Sonuç sayılarını yaz. Hata varsa `process.exitCode = 1`.

- [ ] **Adım 6: Doğrula**

Çalıştır: `npm test`, `npm run lint`. Beklenen: hatasız. Betik gerçek veriyle uygulama sırasında **çalıştırılmaz**; proje sahibi çalıştırır.

- [ ] **Adım 7: Commit**

`Eski Psikoloji lisans hesaplarını silen betik`

### Task 3: İki ayrı liste sayfası

**Files:**
- Create: `src/components/UzmanListesi.tsx`
- Modify: `src/lib/sabitler.ts` (yeni `listeAlani`)
- Modify: `src/lib/uzmanlar.ts:43-55`
- Modify: `src/app/uzmanlar/page.tsx` (tamamı)
- Move: `src/app/ogrenci-uzmanlar/page.tsx` → `src/app/ogrenci-uzmanlar/hakkinda/page.tsx`
- Create: `src/app/ogrenci-uzmanlar/page.tsx`
- Modify: `src/components/UstMenu.tsx:66-68`
- Modify: `src/app/page.tsx:35-50`
- Modify: `src/app/uzmanlar/[id]/page.tsx:37-39,54`
- Modify: `src/app/layout.tsx:20`, `src/app/hakkimizda/page.tsx:51`, `src/app/kullanim-kosullari/page.tsx:57`, `src/app/sss/page.tsx:26`, `src/app/kayit/KayitFormu.tsx:96`
- Test: `scripts/uzman-siniflari.test.mts`

**Interfaces:**
- Produces: `listeAlani(tur: "independent" | "student", alan: unknown): Alan | undefined`
- Produces: `onayliUzmanlar(filtre: { tur?: Uzman["kind"]; alan?: Alan; ara?: string; unvan?: Unvan; bolum?: Bolum })`
- Produces: `UzmanListesi({ tur, baslik, aciklama, arama }: { tur: Uzman["kind"]; baslik: string; aciklama: ReactNode; arama: Record<string, string | string[] | undefined> })`

- [ ] **Adım 1: Başarısız testi ekle**

```ts
test("öğrenci listesinde kapalı alan filtre olmaz", () => {
  assert.equal(listeAlani("student", "psikotik"), undefined);
  assert.equal(listeAlani("student", "bagimlilik"), undefined);
  assert.equal(listeAlani("student", "kaygi"), "kaygi");
});
test("uzman listesinde her alan filtre olur", () => {
  assert.equal(listeAlani("independent", "psikotik"), "psikotik");
  assert.equal(listeAlani("independent", "yok"), undefined);
});
```

- [ ] **Adım 2: `npm test` çalıştır**

Beklenen: FAIL, `listeAlani` yok.

- [ ] **Adım 3: `listeAlani` ve filtreyi ekle**

`onayliUzmanlar` içinde `unvan` için `title`, `bolum` için `department` eşitlik filtresi.

- [ ] **Adım 4: `npm test` çalıştır**

Beklenen: PASS.

- [ ] **Adım 5: `UzmanListesi` bileşenini yaz**

Mevcut `/uzmanlar` sayfasının gövdesi taşınır: arama, telefondaki açılır filtre paneli, boş durum, `puanaGoreSirala`. Farklar:

- `tur` değeri `onayliUzmanlar` çağrısına her zaman geçer. "Tümü / Uzmanlar / Stajyer" filtresi kalkar.
- `independent`: adres `/uzmanlar`, sınıf parametresi `unvan`, `UNVANLAR` seçenekleri.
- `student`: adres `/ogrenci-uzmanlar`, sınıf parametresi `bolum`, `BOLUMLER` seçenekleri.
- İlk seçenek `Tümü`. Geçersiz parametre yok sayılır (`listedeMi`).
- Konu filtresi seçenekleri `student` için `ogrenciyeAcik` ile süzülür; seçili alan `listeAlani` ile bulunur.
- Boş durum bağlantısı: `Tüm uzmanları gör` veya `Tüm öğrenci uzmanları gör`. Metin `Bu alanda henüz uzman yok.` öğrencide `Bu alanda henüz öğrenci uzman yok.` olur.

- [ ] **Adım 6: Sayfaları yaz**

`/uzmanlar` başlık `Uzmanlar`, açıklama `Belgeleri yönetici tarafından kontrol edilip onaylanmış psikolog ve psikolojik danışmanlar.`

`/ogrenci-uzmanlar` metadata başlığı `Öğrenci Uzmanlar | Danışman Buluşma`, başlık `Öğrenci Uzmanlar`, açıklama `Staj kapsamında ücretsiz görüşme yapan PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencileri. Lisanslı uzman değildirler.` + `<OnayGerekir />` + `/ogrenci-uzmanlar/hakkinda` bağlantısı `Ayrıntılar`.

Taşınan sayfanın içe aktarmaları `@/` ile olduğu için değişmez. Bağlantıları `/ogrenci-uzmanlar/hakkinda` yap (Files listesindeki beş yer ve profildeki `Ayrıntılar`).

- [ ] **Adım 7: Menü, ana sayfa, profil**

Menüde `Uzmanlar` bağlantısından hemen sonra `/ogrenci-uzmanlar` bağlantısı: `Öğrenci Uzmanlar · Ücretsiz`, `rounded-full bg-amber-100 px-2 py-0.5 font-medium text-slate-900` sınıflarıyla vurgulu.

Ana sayfa: `Uzmanları gör` düğmesinin yerine iki kapı, `sm:grid-cols-2`. `Uzmanlar` (`bg-teal-100`, `Psikolog ve psikolojik danışmanlarla ücretli seans`, `Uzmanları gör`). `Öğrenci Uzmanlar` (`bg-amber-100`, `Staj kapsamında ücretsiz görüşme`, `<OnayGerekir />`, `Ücretsiz görüş`). `<OlcekAlani />` kapıların altında kalır.

Profil geri bağlantısı: öğrenci için `/ogrenci-uzmanlar` ve `← Tüm öğrenci uzmanlar`, bağımsız için mevcut hali.

- [ ] **Adım 8: Doğrula**

Çalıştır: `npm test`, `npm run lint`, `npm run build`. Beklenen: hatasız; build çıktısında `/ogrenci-uzmanlar` ve `/ogrenci-uzmanlar/hakkinda` görünür.

- [ ] **Adım 9: Commit**

`Uzmanlar ve öğrenci uzmanlar ayrı sayfalarda`

### Task 4: Ciddi durum sorusu

**Files:**
- Modify: `src/app/psikolojik-rahatsizliklar/kurallar.ts`
- Modify: `src/app/uzmanlar/[id]/BasvuruFormu.tsx`
- Modify: `src/app/uzmanlar/[id]/islemler.ts:14-19`
- Modify: `src/app/uzmanlar/[id]/page.tsx` ve `BasvuruFormu` kullanan parça (`Takvim.tsx`, prop zinciri)
- Test: `scripts/rahatsizliklar.test.mts`

**Interfaces:**
- Produces: `ciddiDurumlar(liste: { ad: string; agir: boolean }[]): string[]`
- Produces: `ogrenciBasvurabilir(ogrenci: boolean, yanit: unknown): boolean`
- Produces: `BasvuruFormu` için yeni prop `ciddiDurumlar: string[]`

- [ ] **Adım 1: Başarısız testi ekle**

```ts
test("ciddi durum listesi agir kartlardan gelir", () => {
  assert.deepEqual(ciddiDurumlar(RAHATSIZLIKLAR), [
    "Anoreksiya", "Bipolar Bozukluk", "Bulimiya", "Kumar Bozukluğu",
    "Madde Kullanımı Bozukluğu", "Narkolepsi", "Oyun ve İnternet Bağımlılığı", "Şizofreni",
  ]);
});
test("öğrenciye yalnızca hayır yanıtıyla başvurulur", () => {
  assert.equal(ogrenciBasvurabilir(true, "hayir"), true);
  assert.equal(ogrenciBasvurabilir(true, "evet"), false);
  assert.equal(ogrenciBasvurabilir(true, null), false);
});
test("bağımsız uzman başvurusu sorudan etkilenmez", () => {
  assert.equal(ogrenciBasvurabilir(false, null), true);
});
```

- [ ] **Adım 2: `npm test` çalıştır**

Beklenen: FAIL.

- [ ] **Adım 3: İki saf fonksiyonu yaz**

- [ ] **Adım 4: `npm test` çalıştır**

Beklenen: PASS.

- [ ] **Adım 5: Sunucu kontrolünü ekle**

`basvuruYap` içinde insert'ten önce `uzmanGetir(uzmanId)`. Yoksa `Başvuru gönderilemedi. Lütfen tekrar deneyin.` `ogrenciBasvurabilir(uzman.kind === "student", form.get("ciddiDurum"))` false ise `Bu görüşme öğrenci uzmanlar için uygun değil. Lütfen Uzmanlar sayfasından bir uzman seçin.` Yanıt yazılmaz, loglanmaz.

- [ ] **Adım 6: Soruyu forma ekle**

Yalnızca `ogrenci` için, `fieldset` + `legend` ve iki zorunlu `radio` (`name="ciddiDurum"`, `evet` / `hayir`). Soru: `Şu durumlardan biri için mi görüşmek istiyorsunuz?` Durumlar listelenir.

`evet` seçilince gönder düğmesi gizlenir, şu mesaj görünür: `Bu durumlarda öğrenci uzmanlar görüşme yapamaz. Size bir uzman yardımcı olabilir.` + `/uzmanlar` bağlantısı. Danışan yanıtını değiştirebilir. Yanıt için React durumu kullanılır, depolama ve adres kullanılmaz. Metin `text-slate-700` ile; yalnızca renge güvenilmez.

Durum adları `RAHATSIZLIKLAR` üzerinden sunucu sayfasında `ciddiDurumlar` ile üretilir ve prop olarak iner. Böylece 500 satırlık veri tarayıcıya gitmez.

- [ ] **Adım 7: Doğrula**

Çalıştır: `npm test`, `npm run lint`, `npm run build`. Beklenen: hatasız.

- [ ] **Adım 8: Commit**

`Öğrenci başvurusunda ciddi durum sorusu`

### Task 5: Kartlar ve ölçek bağlantıları

**Files:**
- Modify: `src/app/psikolojik-rahatsizliklar/kurallar.ts:4-7`
- Modify: `src/app/psikolojik-rahatsizliklar/RahatsizlikKarti.tsx:80-85`
- Modify: `src/modules/olcek/OlcekPenceresi.tsx:131,139`
- Modify: `src/app/on-gorusme/page.tsx:89-92`
- Test: `scripts/rahatsizliklar.test.mts:80-81`

**Interfaces:**
- Produces: `uzmanBaglantilari(r: { alan: Alan; agir: boolean }): { uzman: string; ogrenci: string | null }` (`uzmanBaglantisi` kaldırılır)

- [ ] **Adım 1: Eski iddiaları yeni testle değiştir**

```ts
assert.deepEqual(uzmanBaglantilari({ alan: "psikotik", agir: true }), { uzman: "/uzmanlar?alan=psikotik", ogrenci: null });
assert.deepEqual(uzmanBaglantilari({ alan: "kaygi", agir: false }), { uzman: "/uzmanlar?alan=kaygi", ogrenci: "/ogrenci-uzmanlar?alan=kaygi" });
```

Ayrıca her `RAHATSIZLIKLAR` kartı için: `ogrenci` doluysa kartın alanı `ogrenciyeAcik` olmalı.

- [ ] **Adım 2: `npm test` çalıştır**

Beklenen: FAIL.

- [ ] **Adım 3: Fonksiyonu ve kartı değiştir**

Kartta birinci düğme `Bu alanda çalışan uzmanları gör` aynen kalır. `ogrenci` varsa yanına kenarlıklı ikinci düğme: `Öğrenci uzmanlarla ücretsiz görüş`.

- [ ] **Adım 4: Ölçek ve ön görüşme bağlantıları**

`OlcekPenceresi` içinde taban adres: `kind === "independent" ? "/uzmanlar" : "/ogrenci-uzmanlar"`, `alan` sorgusu aynı kalır, `tur` parametresi kalkar. Ölçek metni satır 120: `PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencileri. Görüşmeleri ücretsizdir ve staj kapsamındadır.` + mevcut `<OnayGerekir />`.

`on-gorusme` bağlantısı `/ogrenci-uzmanlar`, metin `Öğrenci uzmanları görün`.

- [ ] **Adım 5: Doğrula**

Çalıştır: `npm test`, `npm run lint`, `npm run build`. Beklenen: hatasız. `Grep` ile `tur=` araması `src` içinde sonuç vermez.

- [ ] **Adım 6: Commit**

`Rahatsızlık kartları ve ölçek yeni listelere bağlandı`

### Task 6: Metinler ve proje dosyaları

**Files:**
- Modify: `src/app/page.tsx:39-40`, `src/app/hakkimizda/page.tsx:25`, `src/app/sss/page.tsx:25`, `src/app/ogrenci-uzmanlar/hakkinda/page.tsx:14-15`, `src/app/uzmanlar/[id]/page.tsx:52`
- Modify: `src/lib/sabitler.ts:38` (`YASAL_METIN_TARIHI = "08.11.2026"`)
- Modify: `CLAUDE.md`, `YAYIN-ONCESI.md`

- [ ] **Adım 1: Metinleri değiştir**

"Son sınıf Psikoloji/PDR" yerine `PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencileri`. Profil uyarısı: `Bu kişi PDR 4. sınıf veya Klinik Psikoloji yüksek lisans öğrencisidir, lisanslı bir uzman değildir.` Bilgi sayfası aynı anlatımı kullanır. Mevcut `<OnayGerekir />` etiketleri kalır; yeni kabul kuralı yazılan yerde yoksa eklenir.

- [ ] **Adım 2: `CLAUDE.md` güncelle**

Bölüm 6'daki `son sınıf Psikoloji/PDR` kuralı yeni kurala çevrilir. Yeni madde: uzmanlar ve öğrenciler ayrı sayfalardadır, unvanlar ikiye indi (2026-11-08; 0021), ciddi durum sorusunun yanıtı kaydedilmez, liste `agir: true` kartlardan gelir.

- [ ] **Adım 3: `YAYIN-ONCESI.md` güncelle**

Üç madde: ciddi durum sorusunu KVKK metnine ekleyin (metin değişirse `KVKK_SURUMU` değişmeli); 8 durumun listesini klinik açıdan onaylayın; PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencilerinin staj kapsamında hizmet verebilmesini avukat/kurum ile doğrulayın.

- [ ] **Adım 4: Doğrula**

Çalıştır: `npm test`, `npm run lint`, `npm run build`. Beklenen: hatasız. `src` içinde `Son sınıf` ve `son sınıf` araması sonuç vermez.

- [ ] **Adım 5: Commit**

`Metinler ve proje kuralları yeni kabul kuralına göre güncellendi`

## Proje sahibinin çalıştıracağı adımlar (kod bittikten sonra)

Sıra önemlidir:

1. `npm run eski-hesaplari-sil` ile sayıya bakın. Bu adım hiçbir şey silmez.
2. `npm run eski-hesaplari-sil -- --onay` ile silin. **Geri alınamaz.**
3. Supabase SQL Editor'de `supabase/migrations/0021_uzman_ogrenci_ayrimi.sql` çalıştırın.
4. `supabase/denetim/0021_denetim.sql` çalıştırın.
5. `npm run test-verisi` çalıştırın.
