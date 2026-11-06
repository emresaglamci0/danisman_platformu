import type { FormDurumu } from "@/lib/hatalar";

export const girdiSinifi =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-teal-800 focus:outline-none focus:ring-1 focus:ring-teal-800";

export const butonSinifi =
  "w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-black hover:text-white hover:bg-teal-800 disabled:opacity-60";

export function DurumMesaji({ durum }: { durum: FormDurumu }) {
  if (durum.hata) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        {durum.hata}
      </p>
    );
  }
  if (durum.basari) {
    return (
      <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
        {durum.basari}
      </p>
    );
  }
  return null;
}
