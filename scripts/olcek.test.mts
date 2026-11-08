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

test("madde 10 Sık sık → öğrenci gizli", () => {
  assert.equal(degerlendir(y({ 1: 3, 2: 3, 3: 3, 10: 2 })).ogrenciGizli, true);
});

test("üç grup uygunsa yalnızca en iyi iki grup alınır (eşitlikte öndeki grup)", () => {
  const s = degerlendir(y({ 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 3, 7: 2 }));
  es(s.alanlar, ["kaygi", "tukenmislik", "uyku", "duygudurum", "yas", "travma"]);
});
