import assert from "node:assert/strict";
import { test } from "node:test";
import { BOLUMLER, UNVANLAR, listeAlani } from "../src/lib/sabitler.ts";

test("yalnızca iki unvan kabul edilir", () => {
  assert.deepEqual(UNVANLAR, { psikolog: "Psikolog", psikolojik_danisman: "Psikolojik Danışman" });
});

test("yalnızca iki öğrenci grubu kabul edilir", () => {
  assert.deepEqual(BOLUMLER, { pdr: "PDR 4. sınıf", klinik_psikoloji_yl: "Klinik Psikoloji Yüksek Lisans" });
});

test("öğrenci listesinde kapalı alan filtre olmaz", () => {
  assert.equal(listeAlani("student", "psikotik"), undefined);
  assert.equal(listeAlani("student", "bagimlilik"), undefined);
  assert.equal(listeAlani("student", "kaygi"), "kaygi");
});

test("uzman listesinde her alan filtre olur", () => {
  assert.equal(listeAlani("independent", "psikotik"), "psikotik");
  assert.equal(listeAlani("independent", "yok"), undefined);
});
