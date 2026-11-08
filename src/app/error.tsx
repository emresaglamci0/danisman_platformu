"use client";

import Link from "next/link";

// Hata burada ekrana veya tarayiciya yazilmaz; icinde hassas veri olabilir (CLAUDE.md, madde 3).
export default function HataSayfasi({ retry }: { retry: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">Bir sorun oluştu</h1>
      <p className="text-slate-600">Sayfa beklenmedik bir hata nedeniyle açılamadı. Lütfen tekrar deneyin.</p>
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => retry()} className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
          Tekrar dene
        </button>
        <Link href="/" className="text-teal-800 underline">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
