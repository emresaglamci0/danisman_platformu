import assert from "node:assert/strict";
import { test } from "node:test";
import {
  haftaGunleri,
  iptalIadeli,
  komisyon,
  odemeKalibiVar,
  saatEtiketi,
  saatIso,
  saatParcalari,
  ucretGecerli,
} from "../src/lib/seans-kurallari.ts";

test("saatIso Türkiye saatini doğru ana çevirir", () => {
  assert.equal(saatIso("2026-11-10", 14), "2026-11-10T11:00:00.000Z");
  assert.equal(saatIso("2026-07-10", 8), "2026-07-10T05:00:00.000Z");
});

test("haftaGunleri pazartesiden başlar ve Türkiye tarihini kullanır", () => {
  // Cumartesi 07.11.2026
  const buHafta = haftaGunleri(0, new Date("2026-11-07T12:00:00Z"));
  assert.equal(buHafta.length, 7);
  assert.equal(buHafta[0].tarih, "2026-11-02");
  assert.equal(buHafta[0].gun, 1);
  assert.equal(buHafta[0].etiket, "Pzt 02.11");
  assert.equal(buHafta[6].tarih, "2026-11-08");
  assert.equal(buHafta[6].gun, 7);
  assert.equal(haftaGunleri(1, new Date("2026-11-07T12:00:00Z"))[1].etiket, "Sal 10.11");
  // UTC'de pazar gecesi, Türkiye'de pazartesi sabahı
  assert.equal(haftaGunleri(0, new Date("2026-11-08T22:00:00Z"))[0].tarih, "2026-11-09");
});

test("saatEtiketi ve saatParcalari her ortamda Türkiye saatini verir", () => {
  assert.equal(saatEtiketi("2026-11-10T11:00:00.000Z"), "Salı 10.11.2026 14:00");
  assert.equal(saatEtiketi("2026-11-15T21:30:00.000Z"), "Pazartesi 16.11.2026 00:30");
  assert.deepEqual(saatParcalari("2026-11-10T11:00:00.000Z"), { tarih: "2026-11-10", saat: 14 });
});

test("ucretGecerli yalnızca 1-10.000 arası tam TL kabul eder", () => {
  for (const hatali of ["0", "10001", "12.5", "abc", "", "-5", "1e3"]) {
    assert.equal(ucretGecerli(hatali), null, hatali);
  }
  assert.equal(ucretGecerli("1"), 1);
  assert.equal(ucretGecerli("1200"), 1200);
  assert.equal(ucretGecerli("10000"), 10000);
});

test("komisyon yüzde 5 alır ve toplamı korur", () => {
  assert.deepEqual(komisyon(120000), { komisyon: 6000, uzmanaKalan: 114000 });
  const kusurlu = komisyon(1010);
  assert.equal(kusurlu.komisyon + kusurlu.uzmanaKalan, 1010);
});

test("iptalIadeli 24 saat kuralını uygular", () => {
  const baslangic = "2026-11-10T11:00:00.000Z";
  const saatOnce = (saat: number) => new Date(new Date(baslangic).getTime() - saat * 3_600_000);
  assert.equal(iptalIadeli("client", baslangic, saatOnce(25)), true);
  assert.equal(iptalIadeli("client", baslangic, saatOnce(23)), false);
  assert.equal(iptalIadeli("expert", baslangic, saatOnce(25)), true);
  assert.equal(iptalIadeli("expert", baslangic, saatOnce(23)), true);
});

test("odemeKalibiVar IBAN ve telefon yakalar", () => {
  for (const metin of [
    "TR33 0006 1005 1978 6457 8413 26",
    "iban: tr330006100519786457841326",
    "0532 123 45 67",
    "+90 532 123 4567",
    "0532-123-45-67",
    "beni 05321234567 ara",
    "0212 555 12 34",
  ]) {
    assert.equal(odemeKalibiVar(metin), true, metin);
  }
});

test("odemeKalibiVar sıradan mesajlarda işaretlemez", () => {
  for (const metin of [
    "Saat 14:00'te görüşelim",
    "2026 yılında 50 dakika seans yaptık",
    "Seans ücreti 1200 TL",
    "17.11.2026 14:00 uygun mu?",
    "Kitap sayfa 120 ile 145 arası",
  ]) {
    assert.equal(odemeKalibiVar(metin), false, metin);
  }
});
