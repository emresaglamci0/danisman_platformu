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
