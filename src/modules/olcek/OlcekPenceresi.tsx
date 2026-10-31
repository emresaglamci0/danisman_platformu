"use client";

import { useRef } from "react";

// PASIF bilesen: hicbir veri toplamaz, sunucuya hicbir sey gondermez.
// Olcekler hazir oldugunda icerik buraya eklenecek.
export function OlcekPenceresi() {
  const pencere = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => pencere.current?.showModal()}
        className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
      >
        Ölçekler
      </button>
      <dialog
        ref={pencere}
        className="m-auto max-w-sm rounded-xl p-6 shadow-xl backdrop:bg-black/40"
      >
        <h2 className="text-lg font-semibold">Ölçekler yakında</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bu bölüm henüz hazırlanıyor. Şu an hiçbir soru sorulmuyor ve hiçbir bilgi kaydedilmiyor.
        </p>
        <form method="dialog" className="mt-4 text-right">
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            Kapat
          </button>
        </form>
      </dialog>
    </>
  );
}
