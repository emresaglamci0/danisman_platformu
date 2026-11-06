import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AcilDurumKutusu } from "@/components/AcilDurumKutusu";
import { AcikRizaMetni, AydinlatmaMetni } from "@/components/kvkk/Metinler";
import { TaslakNotu } from "@/components/kvkk/TaslakNotu";
import { konusmaGetir, mesajlasmaRizasiVar, type Konusma } from "@/lib/konusmalar";
import { mevcutKullanici, type Kullanici } from "@/lib/oturum";
import { ISARET_KATEGORILERI, ISARET_KAYNAKLARI, tarihSaatYaz } from "@/lib/sabitler";
import { mesajlariCoz } from "@/lib/sifreleme";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { ErisimFormu } from "./ErisimFormu";
import { MesajFormu } from "./MesajFormu";
import { OtomatikYenile } from "./OtomatikYenile";
import { RizaFormu } from "./RizaFormu";
import { SikayetFormu } from "./SikayetFormu";

export const metadata = { title: "Konuşma | Danışman Buluşma" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KonusmaSayfasi({ params }: PageProps<"/mesajlar/[id]">) {
  const kullanici = await mevcutKullanici();
  if (!kullanici) redirect("/giris");
  // Admin, iki adimli dogrulama kodunu girmeden hicbir sohbete bakamaz
  if (kullanici.rol === "admin" && kullanici.aal !== "aal2") redirect("/iki-adimli-dogrulama");

  const { id } = await params;
  if (!UUID.test(id)) notFound();
  // Veritabani kurallari: taraflar kendi sohbetini, admin yalnizca isaretli sohbetleri gorur
  const konusma = await konusmaGetir(id);
  if (!konusma) notFound();

  const taraf = kullanici.id === konusma.client_id || kullanici.id === konusma.expert_id;
  if (taraf) return <TarafGorunumu kullanici={kullanici} konusma={konusma} />;
  if (kullanici.rol === "admin") return <AdminGorunumu kullanici={kullanici} konusma={konusma} />;
  notFound();
}

// ---------------------------------------------------------------------
// Konusmanin taraflari (danisan veya uzman)
// ---------------------------------------------------------------------
async function TarafGorunumu({ kullanici, konusma }: { kullanici: Kullanici; konusma: Konusma }) {
  // Ilk mesajlasmadan once KVKK onay ekrani
  if (!(await mesajlasmaRizasiVar(kullanici.id))) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Mesajlaşmadan önce onayınız gerekiyor</h1>
        <TaslakNotu />
        <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
          <p>
            <strong>Mesajlarınızı varsayılan olarak yalnızca siz ve karşı taraf okuyabilirsiniz.</strong>
          </p>
          <p>
            Güvenlik ve kötüye kullanımın önlenmesi amacıyla, şikâyet edilen veya riskli görülen
            sohbetler yetkili yönetici tarafından incelenebilir. Yönetici bunu yalnızca sebep yazarak
            yapabilir ve her erişim değiştirilemeyen bir kayda yazılır.
          </p>
        </div>
        <section className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">KVKK Aydınlatma Metni</h2>
          <AydinlatmaMetni />
        </section>
        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Açık Rıza Metni</h2>
          <AcikRizaMetni />
        </section>
        <RizaFormu konusmaId={konusma.id} />
      </div>
    );
  }

  const supabase = await supabaseSunucu();
  const { data: sikayet } = await supabase
    .from("conversation_flags")
    .select("id")
    .eq("conversation_id", konusma.id)
    .eq("reported_by", kullanici.id)
    .eq("status", "open")
    .maybeSingle();

  const karsiTaraf = kullanici.id === konusma.client_id ? konusma.uzmanAdi : konusma.danisanAdi;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AcilDurumKutusu />
      <Baslik baslik={karsiTaraf} />
      <MesajListesi kullanici={kullanici} konusma={konusma} />
      <MesajFormu konusmaId={konusma.id} />
      {sikayet ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          Bu sohbeti şikayet ettiniz. Yetkili yönetici sohbeti inceleyebilir.
        </p>
      ) : (
        <SikayetFormu konusmaId={konusma.id} />
      )}
      <OtomatikYenile />
    </div>
  );
}

// ---------------------------------------------------------------------
// Admin: yalnizca isaretli sohbet, sebep yazarak, 30 dakika
// ---------------------------------------------------------------------
async function AdminGorunumu({ kullanici, konusma }: { kullanici: Kullanici; konusma: Konusma }) {
  const supabase = await supabaseSunucu();
  const [{ data: okuyabilir }, { data: isaretler }, { data: sonErisim }] = await Promise.all([
    supabase.rpc("admin_sohbet_okuyabilir", { p_konusma: konusma.id }),
    supabase
      .from("conversation_flags")
      .select("id, source, category, note, created_at")
      .eq("conversation_id", konusma.id)
      .eq("status", "open")
      .order("created_at"),
    supabase
      .from("conversation_access_log")
      .select("accessed_at")
      .eq("conversation_id", konusma.id)
      .eq("admin_id", kullanici.id)
      .order("accessed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const acikIsaretler = isaretler ?? [];
  const baslik = `${konusma.danisanAdi} ↔ ${konusma.uzmanAdi}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AcilDurumKutusu />
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{baslik}</h1>
        <Link href="/admin/incelemeler" className="text-sm text-teal-800 hover:underline">
          ← İncelemeler
        </Link>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <h2 className="mb-2 font-semibold">Açık işaretler ({acikIsaretler.length})</h2>
        {acikIsaretler.length === 0 ? (
          <p>Bu sohbette açık şikayet veya inceleme yok; mesajlar açılamaz.</p>
        ) : (
          <ul className="space-y-1">
            {acikIsaretler.map((i) => (
              <li key={i.id}>
                {ISARET_KAYNAKLARI[i.source as keyof typeof ISARET_KAYNAKLARI]} ·{" "}
                {ISARET_KATEGORILERI[i.category] ?? i.category} · {tarihSaatYaz(i.created_at)}
                {i.note && <span className="block text-slate-600">“{i.note}”</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {okuyabilir ? (
        <>
          <p className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">
            Salt okunur inceleme. Erişiminiz kaydedildi
            {sonErisim &&
              `; ${tarihSaatYaz(new Date(new Date(sonErisim.accessed_at).getTime() + 30 * 60_000).toISOString())} saatine kadar geçerli`}
            .
          </p>
          <MesajListesi kullanici={kullanici} konusma={konusma} />
        </>
      ) : (
        acikIsaretler.length > 0 && <ErisimFormu konusmaId={konusma.id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Ortak parcalar
// ---------------------------------------------------------------------
function Baslik({ baslik }: { baslik: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-xl font-bold">{baslik}</h1>
      <Link href="/mesajlar" className="text-sm text-teal-800 hover:underline">
        ← Tüm konuşmalar
      </Link>
    </div>
  );
}

async function MesajListesi({ kullanici, konusma }: { kullanici: Kullanici; konusma: Konusma }) {
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, ciphertext, created_at")
    .eq("conversation_id", konusma.id)
    .order("created_at", { ascending: false })
    .limit(200);
  const satirlar = data ?? [];
  const metinler = await mesajlariCoz(konusma, satirlar.map((m) => m.ciphertext));

  const gonderenAdi = (gonderenId: string) => {
    if (gonderenId === kullanici.id) return "Siz";
    return gonderenId === konusma.client_id ? konusma.danisanAdi : konusma.uzmanAdi;
  };

  return (
    // flex-col-reverse: en yeni mesaj altta durur, liste kendiliginden en alta kaymis acilir
    <div className="flex h-[55vh] flex-col-reverse gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
      {satirlar.length === 0 && (
        <p className="m-auto text-sm text-slate-500">Henüz mesaj yok. İlk mesajı siz yazabilirsiniz.</p>
      )}
      {satirlar.map((m, i) => {
        const benim = m.sender_id === kullanici.id;
        return (
          <div key={m.id} className={`max-w-[85%] ${benim ? "self-end text-right" : "self-start"}`}>
            <p className="text-xs text-slate-500">
              {gonderenAdi(m.sender_id)} · {tarihSaatYaz(m.created_at)}
            </p>
            <p
              className={`mt-0.5 whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-left text-sm ${
                benim ? "bg-teal-700 text-black" : "bg-slate-100 text-slate-900"
              }`}
            >
              {metinler[i] ?? <em className="opacity-70">Bu mesaj görüntülenemiyor.</em>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
