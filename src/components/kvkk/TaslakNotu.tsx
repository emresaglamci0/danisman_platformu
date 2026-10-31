// Metinler avukat tarafindan onaylanana kadar gosterilir.
// Onaydan sonra .env.local icinde KVKK_METINLERI_ONAYLI=true yapilinca gizlenir.
export function TaslakNotu() {
  if (process.env.KVKK_METINLERI_ONAYLI === "true") return null;
  return (
    <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
      Taslaktır, yayınlanmadan önce avukat tarafından onaylanmalıdır.
    </p>
  );
}
