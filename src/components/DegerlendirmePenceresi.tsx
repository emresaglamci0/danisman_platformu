"use client";

import { useEffect, useRef } from "react";
import { degerlendirmeyiErtele } from "@/app/uzmanlar/[id]/puan-islemleri";
import { PuanFormu } from "@/components/PuanFormu";

export function DegerlendirmePenceresi({ uzmanId, uzmanAdi }: { uzmanId: string; uzmanAdi: string }) {
  const pencere = useRef<HTMLDialogElement>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anahtar = "degerlendirme-kapatildi-" + uzmanId;

  useEffect(() => {
    let kapatildi = false;
    try {
      kapatildi = sessionStorage.getItem(anahtar) !== null;
    } catch {
      // depolama kapaliysa yine acilir
    }
    if (!kapatildi && pencere.current && !pencere.current.open) pencere.current.showModal();
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, [anahtar]);

  // Esc ve arka plan tiklamasi: yalnizca bu oturumda tekrar acilmasin.
  function oturumdaKapat() {
    try {
      sessionStorage.setItem(anahtar, "1");
    } catch {
      // yok say
    }
    pencere.current?.close();
  }

  async function dahaSonra() {
    await degerlendirmeyiErtele(uzmanId);
    pencere.current?.close();
  }

  function basarida() {
    zamanlayici.current = setTimeout(() => pencere.current?.close(), 1500);
  }

  return (
    <dialog
      ref={pencere}
      aria-labelledby="degerlendirme-baslik"
      onCancel={(e) => {
        e.preventDefault();
        oturumdaKapat();
      }}
      onClick={(e) => {
        if (e.target === pencere.current) oturumdaKapat();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-xl p-6 shadow-xl backdrop:bg-black/40"
    >
      <h2 id="degerlendirme-baslik" className="text-lg font-semibold text-slate-900">
        Son görüşmeni değerlendir
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {uzmanAdi} ile görüşmeniz nasıldı? Puanınız uzmanın profilinde yalnızca ortalama olarak görünür, adınız
        görünmez.
      </p>
      <div className="mt-4">
        <PuanFormu
          uzmanId={uzmanId}
          basarida={basarida}
          ekDugme={
            <button
              type="button"
              onClick={dahaSonra}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Daha sonra
            </button>
          }
        />
      </div>
    </dialog>
  );
}
