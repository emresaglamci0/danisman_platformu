import assert from "node:assert/strict";
import { test } from "node:test";
import { BOLUMLER, UNVANLAR } from "../src/lib/sabitler.ts";

test("yalnızca iki unvan kabul edilir", () => {
  assert.deepEqual(UNVANLAR, { psikolog: "Psikolog", psikolojik_danisman: "Psikolojik Danışman" });
});

test("yalnızca iki öğrenci grubu kabul edilir", () => {
  assert.deepEqual(BOLUMLER, { pdr: "PDR 4. sınıf", klinik_psikoloji_yl: "Klinik Psikoloji Yüksek Lisans" });
});
