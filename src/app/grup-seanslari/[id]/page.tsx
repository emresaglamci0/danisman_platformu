import Link from "next/link";
import { notFound } from "next/navigation";
import { OnayGerekir } from "@/components/OnayGerekir";
import { acikGrup, GRUP_EN_AZ, GRUP_EN_FAZLA } from "@/lib/gruplar";
import { mevcutKullanici } from "@/lib/oturum";
import { ALANLAR, paraYaz, type Alan } from "@/lib/sabitler";
import { iptalIadeli, saatEtiketi } from "@/lib/seans-kurallari";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { GrupOdemeDurumu, grupOdemesiGetir, GrupSeansYapilmadi, odemeModuluAktif } from "@/modules/odeme";
import { AyrilFormu, KatilFormu } from "../GrupFormlari";

export const metadata = { title: "Grup Seansı | Danışman Buluşma" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Katilim = { id: string; status: "paid" | "cancelled" };
type GrupKaydi = {
  id: string;
  topic: Alan;
  purpose: string;
  starts_at: string;
  ends_at: string;
  price_kurus: number;
  status: "open" | "cancelled";
  meeting_url: string | null;
};

export default async function GrupSeansiSayfasi({ params }: PageProps<"/grup-seanslari/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const kullanici = await mevcutKullanici();
  const vitrin = await acikGrup(id);

  // Katilimci, vitrinden dusen (kapanmis, gecmis, iptal) kendi seansini da gorur. Kurallar: 0018 RLS.
  let katilim: Katilim | null = null;
  let kayit: GrupKaydi | null = null;
  if (kullanici?.rol === "client") {
    const supabase = await supabaseSunucu();
    const { data } = await supabase
      .from("group_participants")
      .select("id, status")
      .eq("group_session_id", id)
      .eq("client_id", kullanici.id)
      .maybeSingle();
    katilim = data as Katilim | null;
    if (katilim) {
      const { data: grup } = await supabase
        .from("group_sessions")
        .select("id, topic, purpose, starts_at, ends_at, price_kurus, status, meeting_url")
        .eq("id", id)
        .maybeSingle();
      kayit = grup as GrupKaydi | null;
    }
  }

  const grup = kayit ?? vitrin;
  if (!grup) notFound();

  const simdi = new Date();
  const odeme = katilim ? await grupOdemesiGetir(katilim.id) : null;
  const aktifKatilim = katilim?.status === "paid" && kayit?.status === "open";
  const baslamadi = new Date(grup.starts_at) > simdi;
  const bitmedi = new Date(grup.ends_at) > simdi;
  const sure = Math.round((new Date(grup.ends_at).getTime() - new Date(grup.starts_at).getTime()) / 60_000);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/grup-seanslari" className="inline-block text-sm text-teal-800 hover:underline">
        ← Tüm grup seansları
      </Link>
      <h1 className="text-2xl font-bold">{ALANLAR[grup.topic]}</h1>
      {vitrin && <p className="text-teal-800">{vitrin.display_name}</p>}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Amaç</h2>
        <p className="whitespace-pre-line text-slate-700">{grup.purpose}</p>
      </section>
      <dl className="grid gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-600">Tarih ve saat</dt>
          <dd>{saatEtiketi(grup.starts_at)}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Süre</dt>
          <dd>{sure} dakika · Online</dd>
        </div>
        <div>
          <dt className="text-slate-600">Kişi başı ücret</dt>
          <dd>{paraYaz(grup.price_kurus)}</dd>
        </div>
        {vitrin && (
          <div>
            <dt className="text-slate-600">Kalan yer</dt>
            <dd>
              {GRUP_EN_FAZLA - vitrin.katilimci} (en az {GRUP_EN_AZ} kişiyle yapılır)
            </dd>
          </div>
        )}
      </dl>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        {kayit?.status === "cancelled" && <p className="font-medium">Bu grup seansı iptal edildi.</p>}
        {katilim?.status === "cancelled" && kayit?.status === "open" && <p className="font-medium">Bu seanstan ayrıldınız.</p>}
        {odeme && <GrupOdemeDurumu odeme={odeme} />}

        {aktifKatilim && (
          <>
            <p className="font-medium text-teal-800">✓ Katılıyorsunuz. Diğer katılımcılar adınızı görmez.</p>
            {bitmedi && kayit?.meeting_url && (
              <a
                href={kayit.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800"
              >
                Görüşmeye katıl
              </a>
            )}
            {bitmedi && !kayit?.meeting_url && <p className="text-slate-600">Uzman görüşme bağlantısını burada paylaşacak.</p>}
            {baslamadi && (
              <div>
                <AyrilFormu
                  grupId={id}
                  aciklama={
                    !odeme
                      ? "Ayrılırsanız yeniden katılamazsınız."
                      : iptalIadeli("client", grup.starts_at, simdi)
                        ? "Ayrılırsanız demo ödeme iade edilmiş sayılır. Yeniden katılamazsınız."
                        : "Seansa 24 saatten az kaldığı için ayrılırsanız iade yapılmaz. Yeniden katılamazsınız."
                  }
                />
                {odeme && <OnayGerekir />}
              </div>
            )}
            {!baslamadi && odeme?.status === "held" && <GrupSeansYapilmadi grupId={id} />}
          </>
        )}

        {!katilim && vitrin && (
          <>
            {!kullanici && (
              <p className="text-slate-600">
                Katılmak için{" "}
                <Link href="/giris" className="text-teal-800 underline">
                  giriş yapın
                </Link>{" "}
                veya{" "}
                <Link href="/kayit" className="text-teal-800 underline">
                  danışan olarak kayıt olun
                </Link>
                .
              </p>
            )}
            {kullanici && kullanici.rol !== "client" && (
              <p className="text-slate-600">Yalnızca danışan hesapları katılabilir.</p>
            )}
            {kullanici?.rol === "client" && vitrin.katilimci >= GRUP_EN_FAZLA && (
              <p className="text-slate-600">Bu seansın kontenjanı doldu.</p>
            )}
            {kullanici?.rol === "client" && vitrin.katilimci < GRUP_EN_FAZLA && (
              <KatilFormu grupId={id} tutar={paraYaz(grup.price_kurus)} odemeAcik={odemeModuluAktif()} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
