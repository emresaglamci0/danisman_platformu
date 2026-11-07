import Link from "next/link";
import { ISARET_KATEGORILERI, ISARET_KAYNAKLARI, paraYaz, tarihSaatYaz } from "@/lib/sabitler";
import { saatEtiketi } from "@/lib/seans-kurallari";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { adminSayfasiniKoru } from "../yetki";
import { IncelemeyeAlFormu } from "./IncelemeyeAlFormu";
import { isaretKapat } from "./islemler";
import { SeansKarari } from "./SeansKarari";
import { UzmanKapatFormu } from "./UzmanKapatFormu";

export const metadata = { title: "İncelemeler | Danışman Buluşma" };

type Isaret = {
  id: string;
  conversation_id: string | null;
  source: keyof typeof ISARET_KAYNAKLARI;
  category: string;
  note: string | null;
  created_at: string;
};

function dakikaFarki(bas: string, bit: string) {
  return Math.round((new Date(bit).getTime() - new Date(bas).getTime()) / 60_000);
}

// "Seans yapilmadi" bildirimi: yonetici yalnizca seansin ozetini gorur, gorusme adresini gormez (0017).
async function SeansKartiAlani({ isaretId }: { isaretId: string }) {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.rpc("admin_seans_karti", { p_isaret: isaretId });
  const kart = (data ?? [])[0] as
    | { starts_at: string; ends_at: string; amount_kurus: number; baglanti_var: boolean }
    | undefined;
  if (!kart) return <p className="w-full text-slate-600">Seans özeti okunamadı.</p>;
  return (
    <div className="w-full">
      <p>
        {saatEtiketi(kart.starts_at)} · {dakikaFarki(kart.starts_at, kart.ends_at)} dakika · {paraYaz(kart.amount_kurus)} ·
        Ödeme incelemede · Görüşme bağlantısı: {kart.baglanti_var ? "eklenmiş" : "eklenmemiş"}
      </p>
      <SeansKarari isaretId={isaretId} grup={false} />
    </div>
  );
}

async function GrupKartiAlani({ isaretId }: { isaretId: string }) {
  const supabase = await supabaseSunucu();
  const { data } = await supabase.rpc("admin_grup_karti", { p_isaret: isaretId });
  const kart = (data ?? [])[0] as
    | { starts_at: string; ends_at: string; amount_kurus: number; baglanti_var: boolean; display_name: string | null }
    | undefined;
  if (!kart) return <p className="text-slate-600">Seans özeti okunamadı.</p>;
  return (
    <div>
      <p>
        {kart.display_name ?? "Ayrılan uzman"} · {saatEtiketi(kart.starts_at)} ·{" "}
        {dakikaFarki(kart.starts_at, kart.ends_at)} dakika · {paraYaz(kart.amount_kurus)} · Ödeme incelemede · Görüşme
        bağlantısı: {kart.baglanti_var ? "eklenmiş" : "eklenmemiş"}
      </p>
      <SeansKarari isaretId={isaretId} grup />
    </div>
  );
}

export default async function IncelemelerSayfasi() {
  await adminSayfasiniKoru();

  const supabase = await supabaseSunucu();
  const [{ data: isaretler }, { data: konusmalar }, { data: erisimler }] = await Promise.all([
    supabase
      .from("conversation_flags")
      .select("id, conversation_id, source, category, note, created_at")
      .eq("status", "open")
      .order("created_at"),
    // Admin yalnizca isaretli sohbetlerin taraflarini gorebilir (veritabani kurali)
    supabase.from("conversations").select("id, expert_id, profiles(full_name), expert_profiles(display_name)"),
    supabase
      .from("conversation_access_log")
      .select("id, admin_id, conversation_id, reason, accessed_at")
      .order("accessed_at", { ascending: false })
      .limit(30),
  ]);

  const konusmaUzmanlari = new Map(
    ((konusmalar ?? []) as unknown as { id: string; expert_id: string | null }[]).map((k) => [k.id, k.expert_id]),
  );
  const taraflar = new Map(
    ((konusmalar ?? []) as unknown as {
      id: string;
      profiles: { full_name: string } | null;
      expert_profiles: { display_name: string } | null;
    }[]).map((k) => [k.id, `${k.profiles?.full_name ?? "Danışan"} ↔ ${k.expert_profiles?.display_name ?? "Uzman"}`]),
  );

  // Acik isaretleri sohbete gore grupla. Grup seansi bildirimlerinin sohbeti yoktur.
  const gruplar = new Map<string, Isaret[]>();
  const grupBildirimleri: Isaret[] = [];
  for (const i of (isaretler ?? []) as Isaret[]) {
    if (i.conversation_id === null) grupBildirimleri.push(i);
    else gruplar.set(i.conversation_id, [...(gruplar.get(i.conversation_id) ?? []), i]);
  }

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-teal-800 hover:underline">
          ← Yönetim paneli
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Şikayetler ve incelemeler</h1>
        <p className="text-sm text-slate-600">
          Sohbetler varsayılan olarak yalnızca iki tarafa açıktır. Yalnızca işaretlenmiş sohbetleri,
          sebep yazarak 30 dakikalığına açabilirsiniz.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Açık işaretli sohbetler ({gruplar.size})</h2>
        {gruplar.size === 0 && <p className="text-sm text-slate-600">Açık şikayet veya inceleme yok.</p>}
        {[...gruplar].map(([konusmaId, liste]) => (
          <article key={konusmaId} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{taraflar.get(konusmaId) ?? "Sohbet"}</h3>
              <Link
                href={`/mesajlar/${konusmaId}`}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
              >
                İncele
              </Link>
            </div>
            <ul className="space-y-2 text-sm">
              {liste.map((i) => (
                <li key={i.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <span>
                    <strong>{ISARET_KAYNAKLARI[i.source]}</strong> · {ISARET_KATEGORILERI[i.category] ?? i.category} ·{" "}
                    {tarihSaatYaz(i.created_at)}
                    {i.note && <span className="block text-slate-600">“{i.note}”</span>}
                  </span>
                  {i.category === "seans_yapilmadi" ? (
                    <SeansKartiAlani isaretId={i.id} />
                  ) : (
                    <form action={isaretKapat}>
                      <input type="hidden" name="isaretId" value={i.id} />
                      <button className="text-teal-800 hover:underline">İncelemeyi kapat</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {liste.some((i) => i.category === "site_disi_odeme") && konusmaUzmanlari.get(konusmaId) && (
              <UzmanKapatFormu uzmanId={konusmaUzmanlari.get(konusmaId)!} />
            )}
          </article>
        ))}
      </section>

      {grupBildirimleri.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Grup seansı bildirimleri ({grupBildirimleri.length})</h2>
          {grupBildirimleri.map((i) => (
            <article key={i.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <p>
                <strong>Seans yapılmadı</strong> · {tarihSaatYaz(i.created_at)}
              </p>
              <GrupKartiAlani isaretId={i.id} />
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Bir sohbeti incelemeye al</h2>
        <p className="text-sm text-slate-600">
          Örneğin e-postayla gelen bir bildirim üzerine kullanabilirsiniz. Sohbet kimliği, sohbet
          adresinin sonundaki koddur. Bu işlem mesajları açmaz; açmak için ayrıca sebep yazmanız gerekir.
        </p>
        <IncelemeyeAlFormu />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Son sohbet erişimleri (değiştirilemez kayıt)</h2>
        {(erisimler ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">Henüz erişim yok.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Tarih/saat</th>
                  <th className="px-3 py-2">Yönetici</th>
                  <th className="px-3 py-2">Sohbet</th>
                  <th className="px-3 py-2">Sebep</th>
                </tr>
              </thead>
              <tbody>
                {(erisimler ?? []).map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-3 py-2">{tarihSaatYaz(e.accessed_at)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.admin_id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{taraflar.get(e.conversation_id) ?? e.conversation_id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
