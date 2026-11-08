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
