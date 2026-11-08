// Acik sikayeti veya incelemesi olan hesap silinmez: kanit yok edilmesin (hesap-islemleri.ts ile ayni kural).
export function silinecekleriAyir(
  hesaplar: string[],
  sohbetler: { id: string; expert_id: string }[],
  acikIsaretler: { conversation_id: string }[],
): { silinecek: string[]; atlanan: string[] } {
  const isaretli = new Set(acikIsaretler.map((i) => i.conversation_id));
  const engelli = new Set(sohbetler.filter((s) => isaretli.has(s.id)).map((s) => s.expert_id));
  return {
    silinecek: hesaplar.filter((h) => !engelli.has(h)),
    atlanan: hesaplar.filter((h) => engelli.has(h)),
  };
}
