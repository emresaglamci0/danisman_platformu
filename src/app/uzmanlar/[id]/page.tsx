import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ciddiDurumlar } from "@/app/psikolojik-rahatsizliklar/kurallar";
import { RAHATSIZLIKLAR } from "@/app/psikolojik-rahatsizliklar/veri";
import { mevcutKullanici, type Kullanici } from "@/lib/oturum";
import { acikGruplar } from "@/lib/gruplar";
import { danisanPuanDurumu } from "@/lib/puanlar";
import { ALANLAR } from "@/lib/sabitler";
import { saatEtiketi } from "@/lib/seans-kurallari";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { uzmanGetir, uzmanUnvani, type Uzman } from "@/lib/uzmanlar";
import { BulutGunes } from "@/components/BulutGunes";
import { OnayGerekir } from "@/components/OnayGerekir";
import { PuanFormu } from "@/components/PuanFormu";
import { UzmanFotografi } from "@/components/UzmanFotografi";
import { Yildizlar } from "@/components/Yildizlar";
import { Takvim } from "./Takvim";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UzmanSayfasi({ params }: PageProps<"/uzmanlar/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const uzman = await uzmanGetir(id);
  if (!uzman) notFound();

  const kullanici = await mevcutKullanici();
  const gruplar = uzman.kind === "independent" ? await acikGruplar(uzman.id) : [];
  const puanDurumu =
    kullanici?.rol === "client" && uzman.kind === "independent"
      ? await danisanPuanDurumu(kullanici.id, uzman.id)
      : null;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <article className="space-y-4">
        <Link
          href={uzman.kind === "student" ? "/ogrenci-uzmanlar" : "/uzmanlar"}
          className="inline-block text-sm text-teal-800 hover:underline"
        >
          {uzman.kind === "student" ? "← Tüm öğrenci uzmanlar" : "← Tüm uzmanlar"}
        </Link>
        <div className="flex items-center gap-4">
          <UzmanFotografi link={uzman.fotoLink} ad={uzman.display_name} boyut={96} />
          <div>
            <h1 className="text-2xl font-bold">{uzman.display_name}</h1>
            <p className="text-teal-800">{uzmanUnvani(uzman)}</p>
            {uzman.kind === "independent" && uzman.puan_sayisi > 0 && uzman.puan_ortalama !== null && (
              <Yildizlar ortalama={uzman.puan_ortalama} sayi={uzman.puan_sayisi} boyut={24} />
            )}
          </div>
        </div>
        {uzman.kind === "student" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Bu kişi PDR 4. sınıf veya Klinik Psikoloji yüksek lisans öğrencisidir, lisanslı bir uzman değildir. Görüşmeler{" "}
            <strong>ücretsiz, staj kapsamında</strong> yapılır. <OnayGerekir />{" "}
            <Link href="/ogrenci-uzmanlar/hakkinda" className="underline">
              Ayrıntılar
            </Link>
          </p>
        )}
        {uzman.offers_free_intro && (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
            Bu uzman <strong>ücretsiz ön görüşme</strong> yapıyor.{" "}
            <Link href="/on-gorusme" className="underline">
              Ön görüşme nedir?
            </Link>
          </p>
        )}
        {uzman.bio && <p className="whitespace-pre-line leading-relaxed text-slate-700">{uzman.bio}</p>}
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

      <aside className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm md:sticky md:top-6">
        <h2 className="font-semibold">Görüşme bilgileri</h2>
        <dl className="space-y-2">
          <div>
            <dt className="text-slate-600">Görüşme şekli</dt>
            <dd>{[uzman.offers_online && "Online", uzman.offers_in_person && "Yüz yüze"].filter(Boolean).join(", ")}</dd>
          </div>
          {uzman.session_minutes && (
            <div>
              <dt className="text-slate-600">Seans süresi</dt>
              <dd>{uzman.session_minutes} dakika</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-600">Seans türü</dt>
            <dd>{gruplar.length > 0 ? "Bireysel, Grup" : "Bireysel"}</dd>
          </div>
        </dl>
        {uzman.offers_in_person && uzman.district && (
          <div className="space-y-1 border-t border-slate-200 pt-3">
            <p>
              <strong>Yüz yüze görüşme:</strong> {uzman.district}, {uzman.city}
            </p>
            <p className="text-xs text-slate-600">
              Yüz yüze görüşme ve ödeme site dışındadır, iade ve koruma kapsamında değildir. <OnayGerekir />
            </p>
          </div>
        )}
      </aside>

      {puanDurumu?.puanVerebilir && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 md:col-span-2">
          <h2 className="text-lg font-semibold">Bu uzmanı değerlendirin</h2>
          {puanDurumu.puanim !== null && (
            <p className="text-sm text-slate-600">Daha önce verdiğiniz puanı değiştirebilirsiniz.</p>
          )}
          <PuanFormu uzmanId={uzman.id} mevcutPuan={puanDurumu.puanim} />
        </section>
      )}

      <section className="space-y-3 md:col-span-2">
        <h2 className="text-lg font-semibold">Uygun saatler</h2>
        <TakvimAlani uzman={uzman} kullanici={kullanici} />
      </section>

      {gruplar.length > 0 && (
        <section className="space-y-3 md:col-span-2">
          <h2 className="text-lg font-semibold">Açık grup seansları</h2>
          <ul className="space-y-2 text-sm">
            {gruplar.map((g) => (
              <li key={g.id}>
                <Link href={`/grup-seanslari/${g.id}`} className="text-teal-800 underline">
                  {ALANLAR[g.topic]} · {saatEtiketi(g.starts_at)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

async function TakvimAlani({ uzman, kullanici }: { uzman: Uzman; kullanici: Kullanici | null }) {
  if (!uzman.offers_online) {
    return (
      <p className="text-sm text-slate-600">
        Bu uzman yalnızca yüz yüze görüşüyor, site üzerinden randevu alınamaz.
      </p>
    );
  }

  const supabase = await supabaseSunucu();
  const simdi = new Date();
  const { data } = await supabase.rpc("uzman_musait_saatler", {
    p_uzman: uzman.id,
    p_bas: simdi.toISOString(),
    p_bit: new Date(simdi.getTime() + 28 * 24 * 3_600_000).toISOString(),
  });
  // Veritabani saati kendi biciminde dondurur; takvim aynı metni arayabilsin diye tek bicime cevrilir
  const saatler = ((data ?? []) as string[]).map((s) => new Date(s).toISOString());

  if (saatler.length === 0) {
    return <p className="text-sm text-slate-600">Uzman henüz uygun saat belirtmedi.</p>;
  }

  const takvim = (uzmanId: string | null, not?: ReactNode) => (
    <>
      <Takvim
        saatler={saatler}
        simdi={simdi.toISOString()}
        uzmanId={uzmanId}
        ogrenci={uzman.kind === "student"}
        ciddiDurumlar={uzman.kind === "student" ? ciddiDurumlar(RAHATSIZLIKLAR) : []}
      >
        {not && <p className="text-sm text-slate-600">{not}</p>}
      </Takvim>
      <BulutGunes />
    </>
  );

  if (!kullanici) {
    return takvim(
      null,
      <>
        Başvurmak için{" "}
        <Link href="/giris" className="text-teal-800 underline">
          giriş yapın
        </Link>{" "}
        veya{" "}
        <Link href="/kayit" className="text-teal-800 underline">
          danışan olarak kayıt olun
        </Link>
        .
      </>,
    );
  }
  if (kullanici.rol !== "client") return takvim(null, "Yalnızca danışan hesapları başvuru yapabilir.");

  const { data: bekleyen } = await supabase
    .from("applications")
    .select("id")
    .eq("expert_id", uzman.id)
    .eq("client_id", kullanici.id)
    .eq("status", "pending")
    .maybeSingle();

  if (bekleyen) {
    return takvim(
      null,
      <>
        Bu uzmana yanıt bekleyen bir başvurunuz var.{" "}
        <Link href="/panel" className="text-teal-800 underline">
          Panelinizden
        </Link>{" "}
        takip edebilirsiniz.
      </>,
    );
  }

  return takvim(uzman.id);
}
