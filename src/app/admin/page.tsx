import Link from "next/link";
import { UzmanFotografi } from "@/components/UzmanFotografi";
import { fotografLinkleri } from "@/lib/fotograf";
import { BELGE_TURLERI, UZMAN_DURUMLARI, belgeTurleri, tarihYaz, type BelgeTuru, type UzmanDurumu } from "@/lib/sabitler";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { uzmanUnvani, type Uzman } from "@/lib/uzmanlar";
import { fotografKaldir } from "./islemler";
import { KararFormu } from "./KararFormu";
import { adminSayfasiniKoru } from "./yetki";

export const metadata = { title: "Yönetim | Danışman Buluşma" };

type Belge = { id: string; doc_type: BelgeTuru; storage_path: string | null; mime_type: string; size_bytes: number; created_at: string };
type BekleyenUzman = Pick<Uzman, "id" | "kind" | "display_name" | "title" | "department"> & {
  created_at: string;
  expert_documents: Belge[];
};

const MIME_ADI: Record<string, string> = { "application/pdf": "PDF", "image/jpeg": "JPG", "image/png": "PNG" };

export default async function AdminSayfasi() {
  // Admin olmayan kisiye sayfanin varligini bile gostermiyoruz; kod girmemis admin dogrulamaya gider
  await adminSayfasiniKoru();

  const supabase = await supabaseSunucu();
  const [{ data: bekleyenler }, { data: fotografli }] = await Promise.all([
    supabase
      .from("expert_profiles")
      .select(
        "id, kind, display_name, title, department, created_at, expert_documents(id, doc_type, storage_path, mime_type, size_bytes, created_at)",
      )
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("expert_profiles")
      .select("id, display_name, status, photo_path")
      .not("photo_path", "is", null)
      .order("display_name"),
  ]);

  const tumBekleyenler = (bekleyenler ?? []) as BekleyenUzman[];
  const incelenecekler = tumBekleyenler.filter((u) => u.expert_documents.some((b) => b.storage_path));
  const belgesizSayisi = tumBekleyenler.length - incelenecekler.length;

  const fotoListesi = (fotografli ?? []) as { id: string; display_name: string; status: UzmanDurumu; photo_path: string }[];
  const fotoLinkleri = await fotografLinkleri(fotoListesi.map((u) => u.photo_path));

  // Ogrenci onayi icin varsayilan bitis: bugunden 6 ay sonrasi
  const alti = new Date();
  alti.setMonth(alti.getMonth() + 6);
  const varsayilanTarih = alti.toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Yönetim paneli</h1>
        <Link href="/admin/incelemeler" className="text-sm text-teal-800 underline">
          Şikayetler ve incelemeler
        </Link>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Onay bekleyen uzmanlar ({incelenecekler.length})</h2>
          {belgesizSayisi > 0 && (
            <p className="text-sm text-slate-500">Ayrıca {belgesizSayisi} uzman henüz belge yüklemedi.</p>
          )}
        </div>

        {incelenecekler.length === 0 && <p className="text-sm text-slate-600">İncelenecek başvuru yok.</p>}

        {incelenecekler.map((uzman) => (
          <article key={uzman.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <h3 className="font-semibold">{uzman.display_name}</h3>
              <p className="text-sm text-teal-800">{uzmanUnvani(uzman)}</p>
              <p className="text-xs text-slate-500">Kayıt: {tarihYaz(uzman.created_at)}</p>
            </div>

            <ul className="space-y-1 text-sm">
              {belgeTurleri(uzman.kind).map((tur) => {
                const belge = uzman.expert_documents.find((b) => b.doc_type === tur && b.storage_path);
                return (
                  <li key={tur} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span>{BELGE_TURLERI[tur].ad}</span>
                    {belge ? (
                      <a
                        href={`/admin/belge/${belge.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-800 underline"
                      >
                        Görüntüle ({MIME_ADI[belge.mime_type]}, {Math.ceil(belge.size_bytes / 1024)} KB)
                      </a>
                    ) : (
                      <span className="text-amber-700">Eksik</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-slate-500">
              Barkodlu belgeleri turkiye.gov.tr &quot;Barkodlu Belge Doğrulama&quot; sayfasından kontrol edin.
              Görüntüleme linki 60 saniye geçerlidir. Karar verildiğinde belge dosyaları silinir.
            </p>

            <KararFormu uzmanId={uzman.id} ogrenci={uzman.kind === "student"} varsayilanTarih={varsayilanTarih} />
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Profil fotoğrafları ({fotoListesi.length})</h2>
        {fotoListesi.length === 0 && <p className="text-sm text-slate-600">Yüklenmiş fotoğraf yok.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fotoListesi.map((uzman) => (
            <div key={uzman.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <UzmanFotografi link={fotoLinkleri[uzman.photo_path]} ad={uzman.display_name} boyut={64} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{uzman.display_name}</p>
                <p className="text-slate-500">{UZMAN_DURUMLARI[uzman.status]}</p>
                <form action={fotografKaldir}>
                  <input type="hidden" name="uzmanId" value={uzman.id} />
                  <button className="text-red-700 hover:underline">Uygunsuz, kaldır</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
