// Henuz dogrulanmamis bir iddianin yanina konur (staj, supervizyon, kurum onayi, hukuki konular).
// Bilerek bir ayarla gizlenmez: avukat/kurum onayindan sonra metin elle duzeltilip etiket kaldirilmalidir.
export function OnayGerekir() {
  return (
    <span className="whitespace-nowrap rounded bg-amber-100 px-1 text-xs font-semibold text-amber-900">
      [AVUKAT/KURUM ONAYI GEREKİR]
    </span>
  );
}
