import assert from "node:assert/strict";
import { test } from "node:test";
import { ALANLAR, OGRENCIYE_KAPALI_ALANLAR, alanlariSuz, ogrenciyeAcik } from "../src/lib/sabitler.ts";

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
