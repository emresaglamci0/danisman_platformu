import assert from "node:assert/strict";
import { test } from "node:test";
import { ALANLAR } from "../src/lib/sabitler.ts";
import { ciddiDurumlar, ogrenciBasvurabilir, oneCikanKartlar, uzmanBaglantisi } from "../src/app/psikolojik-rahatsizliklar/kurallar.ts";
import { HISLER, RAHATSIZLIKLAR } from "../src/app/psikolojik-rahatsizliklar/veri.ts";

const bul = (ad: string) => {
  const r = RAHATSIZLIKLAR.find((x) => x.ad === ad);
  assert.ok(r, `kart yok: ${ad}`);
  return r;
};

test("27 rahatsızlık, adlar benzersiz ve Türkçe alfabetik", () => {
  assert.equal(RAHATSIZLIKLAR.length, 27);
  const adlar = RAHATSIZLIKLAR.map((r) => r.ad);
  assert.equal(new Set(adlar).size, 27);
  assert.deepEqual(adlar, [...adlar].sort((a, b) => a.localeCompare(b, "tr")));
});

test("ağır liste tam olarak beklenen 8 kart", () => {
  assert.deepEqual(
    RAHATSIZLIKLAR.filter((r) => r.agir).map((r) => r.ad).sort((a, b) => a.localeCompare(b, "tr")),
    ["Anoreksiya", "Bipolar Bozukluk", "Bulimiya", "Kumar Bozukluğu", "Madde Kullanımı Bozukluğu", "Narkolepsi", "Oyun ve İnternet Bağımlılığı", "Şizofreni"],
  );
});

test("her kartın alanı geçerli, 3-5 belirti ve en az bir https kaynağı var", () => {
  for (const r of RAHATSIZLIKLAR) {
    assert.ok(r.alan in ALANLAR, `${r.ad}: alan geçersiz`);
    assert.ok(r.belirtiler.length >= 3 && r.belirtiler.length <= 5, `${r.ad}: belirti sayısı`);
    assert.ok(r.kaynaklar.length >= 1, `${r.ad}: kaynak yok`);
    for (const k of r.kaynaklar) assert.match(k.url, /^https:\/\//, `${r.ad}: ${k.url}`);
    for (const alan of [r.aciklama, r.nedenler, r.tedavi]) assert.ok(alan.trim().length > 0, `${r.ad}: boş metin`);
  }
});

test("kart-alan eşleşmesi spec tablosuyla aynı", () => {
  const tablo: Record<string, string[]> = {
    kaygi: ["Anksiyete", "Hastalık Kaygısı", "Obsesif Kompulsif Bozukluk", "Özgül Fobi", "Panik Bozukluk", "Sosyal Kaygı Bozukluğu", "Agorafobi"],
    duygudurum: ["Depresyon", "Bipolar Bozukluk", "Kalıcı Depresif Bozukluk", "Doğum Sonrası Depresyon"],
    travma: ["Travma Sonrası Stres Bozukluğu", "Uyum Bozukluğu"],
    yeme: ["Anoreksiya", "Bulimiya", "Tıkınırcasına Yeme Bozukluğu", "Beden Disformik Bozukluğu"],
    bagimlilik: ["Madde Kullanımı Bozukluğu", "Kumar Bozukluğu", "Oyun ve İnternet Bağımlılığı"],
    uyku: ["İnsomni", "Narkolepsi"],
    cinsel: ["Cinsel Bozukluklar"],
    norogelisim: ["DEHB (Dikkat Eksikliği ve Hiperaktivite Bozukluğu)", "Otizm Spektrum Bozukluğu", "Disleksi"],
    psikotik: ["Şizofreni"],
  };
  let satir = 0;
  for (const [alan, kartlar] of Object.entries(tablo)) {
    for (const ad of kartlar) {
      assert.equal(bul(ad).alan, alan, ad);
      satir++;
    }
  }
  assert.equal(satir, 27);
});

test("bırakamama hissi oyun ve internet bağımlılığı kartını da gösterir", () => {
  const his = HISLER.find((h) => h.ad === "Bırakmak istiyorum ama bırakamıyorum");
  assert.ok(his?.kartlar.includes("Oyun ve İnternet Bağımlılığı"));
});

test("her his var olan kartlara bağlanır ve her kart en az bir hisle bulunur", () => {
  assert.ok(HISLER.length >= 12 && HISLER.length <= 17, "his sayısı 12-17");
  assert.equal(new Set(HISLER.map((h) => h.ad)).size, HISLER.length);
  const adlar = new Set(RAHATSIZLIKLAR.map((r) => r.ad));
  const bagli = new Set<string>();
  for (const h of HISLER) {
    assert.ok(h.kartlar.length > 0, `${h.ad}: kart yok`);
    for (const k of h.kartlar) {
      assert.ok(adlar.has(k), `${h.ad}: bilinmeyen kart ${k}`);
      bagli.add(k);
    }
  }
  for (const ad of adlar) assert.ok(bagli.has(ad), `hiçbir hisle bulunmuyor: ${ad}`);
});

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

test("ciddi durum listesi agir kartlardan gelir", () => {
  assert.deepEqual(ciddiDurumlar(RAHATSIZLIKLAR), [
    "Anoreksiya",
    "Bipolar Bozukluk",
    "Bulimiya",
    "Kumar Bozukluğu",
    "Madde Kullanımı Bozukluğu",
    "Narkolepsi",
    "Oyun ve İnternet Bağımlılığı",
    "Şizofreni",
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
