import assert from "node:assert/strict";
import { test } from "node:test";
import { silinecekleriAyir } from "./eski-psikoloji-kurali.mts";

test("açık şikayeti olan hesap atlanır", () => {
  const sonuc = silinecekleriAyir(
    ["a", "b"],
    [
      { id: "s1", expert_id: "a" },
      { id: "s2", expert_id: "b" },
    ],
    [{ conversation_id: "s2" }],
  );
  assert.deepEqual(sonuc, { silinecek: ["a"], atlanan: ["b"] });
});

test("sohbeti olmayan hesap silinir", () => {
  assert.deepEqual(silinecekleriAyir(["a"], [], []), { silinecek: ["a"], atlanan: [] });
});
