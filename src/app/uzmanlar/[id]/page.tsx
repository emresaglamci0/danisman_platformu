import Link from "next/link";
import { notFound } from "next/navigation";
import { mevcutKullanici, type Kullanici } from "@/lib/oturum";
import { ALANLAR } from "@/lib/sabitler";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { uzmanGetir, uzmanUnvani } from "@/lib/uzmanlar";
import { BasvuruFormu } from "./BasvuruFormu";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UzmanSayfasi({ params }: PageProps<"/uzmanlar/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const uzman = await uzmanGetir(id);
  if (!uzman) notFound();

  const kullanici = await mevcutKullanici();

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <article className="space-y-4">
        <Link href="/uzmanlar" className="text-sm text-teal-800 hover:underline">
          ← Tüm uzmanlar
        </Link>
        <h1 className="text-2xl font-bold">{uzman.display_name}</h1>
        <p className="text-teal-800">{uzmanUnvani(uzman)}</p>
        {uzman.kind === "student" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Bu kişi son sınıf öğrencisidir ve staj kapsamında hizmet verir.
          </p>
        )}
        {uzman.bio && <p className="whitespace-pre-line text-slate-700">{uzman.bio}</p>}
        <div>
          <h2 className="mb-2 text-sm font-semibold">Çalıştığı alanlar</h2>
          <ul className="flex flex-wrap gap-1.5">
            {uzman.specialties.map((alan) => (
              <li key={alan} className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
                {ALANLAR[alan] ?? alan}
              </li>
            ))}
          </ul>
        </div>
      </article>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Başvuru yap</h2>
        <BasvuruAlani uzmanId={uzman.id} kullanici={kullanici} />
      </aside>
    </div>
  );
}

async function BasvuruAlani({
  uzmanId,
  kullanici,
}: {
  uzmanId: string;
  kullanici: Kullanici | null;
}) {
  if (!kullanici) {
    return (
      <p className="text-sm text-slate-600">
        Başvurmak için{" "}
        <Link href="/giris" className="text-teal-800 underline">
          giriş yapın
        </Link>{" "}
        veya{" "}
        <Link href="/kayit" className="text-teal-800 underline">
          danışan olarak kayıt olun
        </Link>
        .
      </p>
    );
  }
  if (kullanici.rol !== "client") {
    return <p className="text-sm text-slate-600">Yalnızca danışan hesapları başvuru yapabilir.</p>;
  }

  const supabase = await supabaseSunucu();
  const { data: bekleyen } = await supabase
    .from("applications")
    .select("id")
    .eq("expert_id", uzmanId)
    .eq("client_id", kullanici.id)
    .eq("status", "pending")
    .maybeSingle();

  if (bekleyen) {
    return (
      <p className="text-sm text-slate-600">
        Bu uzmana yanıt bekleyen bir başvurunuz var.{" "}
        <Link href="/panel" className="text-teal-800 underline">
          Panelinizden
        </Link>{" "}
        takip edebilirsiniz.
      </p>
    );
  }

  return <BasvuruFormu uzmanId={uzmanId} />;
}
