import Link from "next/link";
import { AcikRizaMetni, AydinlatmaMetni } from "@/components/kvkk/Metinler";
import { TaslakNotu } from "@/components/kvkk/TaslakNotu";
import { mevcutKullanici } from "@/lib/oturum";
import { tarihSaatYaz } from "@/lib/sabitler";
import { supabaseSunucu } from "@/lib/supabase/sunucu";

export const metadata = { title: "KVKK | Danışman Buluşma" };

const BELGE_ADLARI: Record<string, string> = {
  kvkk_aydinlatma: "Aydınlatma metni okundu",
  acik_riza_mesajlasma: "Mesajlaşma açık rızası",
};

export default async function KvkkSayfasi() {
  const kullanici = await mevcutKullanici();
  let onaylar: { document: string; version: string; accepted_at: string }[] = [];
  if (kullanici) {
    const supabase = await supabaseSunucu();
    const { data } = await supabase
      .from("consents")
      .select("document, version, accepted_at")
      .eq("user_id", kullanici.id)
      .order("accepted_at", { ascending: false });
    onaylar = data ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">KVKK ve Gizlilik</h1>
        <TaslakNotu />
        <p className="text-sm text-slate-600">
          Sade bir özet için{" "}
          <Link href="/gizlilik" className="text-teal-800 underline">
            Gizlilik Politikası
          </Link>
          , çerezler için{" "}
          <Link href="/cerezler" className="text-teal-800 underline">
            Çerez Bildirimi
          </Link>{" "}
          sayfasına bakabilirsiniz.
        </p>
      </div>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Kişisel Verilerin Korunması Aydınlatma Metni</h2>
        <AydinlatmaMetni />
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Mesajlaşma için Açık Rıza Metni</h2>
        <AcikRizaMetni />
      </section>

      {kullanici && (
        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Onay kayıtlarınız</h2>
          {onaylar.length === 0 ? (
            <p className="text-sm text-slate-600">Kayıt bulunamadı.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {onaylar.map((o, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2">
                  <span>{BELGE_ADLARI[o.document] ?? o.document}</span>
                  <span className="text-slate-600">
                    {tarihSaatYaz(o.accepted_at)} · sürüm {o.version}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
