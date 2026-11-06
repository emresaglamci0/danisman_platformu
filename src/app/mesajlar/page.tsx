import Link from "next/link";
import { redirect } from "next/navigation";
import { okunmamisMesajlar } from "@/lib/bildirimler";
import { konusmalariGetir } from "@/lib/konusmalar";
import { mevcutKullanici } from "@/lib/oturum";
import { tarihYaz } from "@/lib/sabitler";

export const metadata = { title: "Mesajlar | Danışman Buluşma" };

export default async function MesajlarSayfasi() {
  const kullanici = await mevcutKullanici();
  if (!kullanici) redirect("/giris");
  // Admin sohbetleri listeleyemez; yalnizca isaretli olanlari Incelemeler sayfasindan acabilir
  if (kullanici.rol === "admin") redirect("/admin/incelemeler");

  const [konusmalar, okunmamis] = await Promise.all([konusmalariGetir(), okunmamisMesajlar()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mesajlar</h1>
        <p className="text-sm text-slate-600">Konuşmalar, uzman başvuruyu kabul ettiğinde açılır.</p>
      </div>

      {konusmalar.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Henüz bir konuşma yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {konusmalar.map((k) => (
            <li key={k.id}>
              <Link
                href={`/mesajlar/${k.id}`}
                className="flex justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-600"
              >
                <span className="font-medium">
                  {kullanici.id === k.client_id ? k.uzmanAdi : k.danisanAdi}
                  {!!okunmamis.get(k.id) && (
                    <span className="ml-2 rounded-full bg-teal-700 px-2 py-0.5 text-xs font-semibold text-black">
                      {okunmamis.get(k.id)} yeni
                    </span>
                  )}
                </span>
                <span className="text-sm text-slate-500">{tarihYaz(k.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
