import Link from "next/link";
import { GRUP_EN_AZ, GRUP_EN_FAZLA } from "@/lib/gruplar";
import { ALANLAR, paraYaz, type Alan } from "@/lib/sabitler";
import { saatEtiketi, saatParcalari } from "@/lib/seans-kurallari";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { supabaseYonetici } from "@/lib/supabase/yonetici";
import { GrupBaglantiFormu, GrupIptalFormu, GrupSeansFormu } from "./GrupSeansFormu";

const GUN = 24 * 3_600_000;

type Grup = {
  id: string;
  topic: Alan;
  starts_at: string;
  ends_at: string;
  price_kurus: number;
  status: "open" | "cancelled";
  meeting_url: string | null;
};

// Yalnizca bagimsiz uzman panelinde gosterilir. Katilimci adlarini yalnizca grubun uzmani gorur.
export async function UzmanGrupSeanslari({ uzmanId }: { uzmanId: string }) {
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("group_sessions")
    .select("id, topic, starts_at, ends_at, price_kurus, status, meeting_url")
    .eq("expert_id", uzmanId)
    .order("starts_at", { ascending: false })
    .limit(20);
  const gruplar = (data ?? []) as Grup[];

  const adlar = new Map<string, string[]>();
  if (gruplar.length > 0) {
    // Danisanlar profil tablosunda uzmana acik degil; gruplar uzmanin kendi kaydi oldugu dogrulandi.
    const { data: katilimcilar } = await supabaseYonetici()
      .from("group_participants")
      .select("group_session_id, profiles(full_name)")
      .eq("status", "paid")
      .in("group_session_id", gruplar.map((g) => g.id));
    for (const k of (katilimcilar ?? []) as unknown as {
      group_session_id: string;
      profiles: { full_name: string } | null;
    }[]) {
      adlar.set(k.group_session_id, [...(adlar.get(k.group_session_id) ?? []), k.profiles?.full_name ?? "Danışan"]);
    }
  }

  const simdi = new Date().getTime();
  const enErken = saatParcalari(new Date(simdi + GUN).toISOString()).tarih;
  const enGec = saatParcalari(new Date(simdi + 28 * GUN).toISOString()).tarih;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="font-semibold">Grup seanslarım</h2>
        <p className="mt-1 text-sm text-slate-600">
          Her grup en az {GRUP_EN_AZ}, en fazla {GRUP_EN_FAZLA} kişiyle yapılır. Amacı ve konuyu açıkça yazın. Danışanlar
          birbirinin adını görmez.
        </p>
      </div>
      <GrupSeansFormu enErken={enErken} enGec={enGec} />
      {gruplar.map((g) => {
        const liste = adlar.get(g.id) ?? [];
        const acik = g.status === "open" && new Date(g.ends_at).getTime() > simdi;
        return (
          <article key={g.id} className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium">
              {ALANLAR[g.topic]} · {saatEtiketi(g.starts_at)} · {paraYaz(g.price_kurus)}
            </p>
            <p className="text-slate-600">
              {g.status === "cancelled" ? "İptal edildi" : `Katılımcı: ${liste.length}/${GRUP_EN_FAZLA}`}
              {g.status === "open" && liste.length > 0 && ` (${liste.join(", ")})`}
            </p>
            {acik && <GrupBaglantiFormu grupId={g.id} baglanti={g.meeting_url ?? ""} />}
            {g.status === "open" && new Date(g.starts_at).getTime() > simdi && <GrupIptalFormu grupId={g.id} />}
          </article>
        );
      })}
    </section>
  );
}

export async function DanisanGrupSeanslari({ danisanId }: { danisanId: string }) {
  // Sunucudan okunur: ayrilan danisan grup tablosunu kendisi okuyamaz. Baglanti burada secilmez.
  const { data } = await supabaseYonetici()
    .from("group_participants")
    .select("group_session_id, status, group_sessions(topic, starts_at, status)")
    .eq("client_id", danisanId)
    .order("joined_at", { ascending: false });
  const kayitlar = (data ?? []) as unknown as {
    group_session_id: string;
    status: "paid" | "cancelled";
    group_sessions: { topic: Alan; starts_at: string; status: "open" | "cancelled" } | null;
  }[];
  if (kayitlar.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Grup seanslarım</h2>
      {kayitlar.map((k) => (
        <Link
          key={k.group_session_id}
          href={`/grup-seanslari/${k.group_session_id}`}
          className="block rounded-xl border border-slate-200 bg-white p-4 text-sm hover:border-teal-700"
        >
          {k.group_sessions && (
            <>
              <span className="font-medium">{ALANLAR[k.group_sessions.topic]}</span> ·{" "}
              {saatEtiketi(k.group_sessions.starts_at)}
            </>
          )}
          <span className="block text-slate-600">
            {k.group_sessions?.status === "cancelled"
              ? "İptal edildi"
              : k.status === "cancelled"
                ? "Ayrıldınız"
                : "Katılıyorsunuz"}
          </span>
        </Link>
      ))}
    </section>
  );
}
