import "server-only";
import { OnayGerekir } from "@/components/OnayGerekir";
import { paraYaz } from "@/lib/sabitler";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { odemeModuluAktif } from "./ayar";
import { OdemeDugmesi } from "./OdemeDugmesi";

export { odemeModuluAktif };

export type DemoOdeme = {
  session_offer_id: string;
  amount_kurus: number;
  commission_kurus: number;
  expert_net_kurus: number;
  status: "held" | "in_review" | "transferred" | "refunded";
};

const DURUMLAR: Record<DemoOdeme["status"], string> = {
  held: "Ödeme bekletiliyor",
  in_review: "Ödeme yönetici incelemesinde",
  transferred: "Ödeme uzmana aktarıldı",
  refunded: "Ödeme iade edildi",
};

export async function odemeleriGetir(seansIdler: string[]): Promise<Map<string, DemoOdeme>> {
  if (!odemeModuluAktif() || seansIdler.length === 0) return new Map();
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("demo_payments")
    .select("session_offer_id, amount_kurus, commission_kurus, expert_net_kurus, status")
    .in("session_offer_id", seansIdler);
  return new Map(((data ?? []) as DemoOdeme[]).map((o) => [o.session_offer_id, o]));
}

// Danisanin plani onayladiktan sonra gordugu adim. Kart bilgisi veya baska odeme bilgisi istenmez.
export function OdemeAdimi({ planId, konusmaId, tutar }: { planId: string; konusmaId: string; tutar: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="font-semibold text-amber-900">Demo ödeme: {paraYaz(tutar)}</p>
      <p className="text-amber-900">Bu bir demodur, para çekilmez. Kart bilgisi istenmez.</p>
      <OdemeDugmesi tur="odeme" planId={planId} konusmaId={konusmaId} />
    </div>
  );
}

export function OdemeDurumu({ odeme, uzmanMi }: { odeme: DemoOdeme; uzmanMi: boolean }) {
  return (
    <p className="text-slate-600">
      {DURUMLAR[odeme.status]} (demo)
      {uzmanMi &&
        ` · Komisyon: ${paraYaz(odeme.commission_kurus)} · Size kalan: ${paraYaz(odeme.expert_net_kurus)}`}
    </p>
  );
}

// Grup seansi odemesi (0018). Danisan yalnizca kendi kaydini okuyabilir.
export async function grupOdemesiGetir(katilimciId: string): Promise<Pick<DemoOdeme, "status"> | null> {
  if (!odemeModuluAktif()) return null;
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("demo_group_payments")
    .select("status")
    .eq("group_participant_id", katilimciId)
    .maybeSingle();
  return data as Pick<DemoOdeme, "status"> | null;
}

export function GrupOdemeDurumu({ odeme }: { odeme: Pick<DemoOdeme, "status"> }) {
  return <p className="text-slate-600">{DURUMLAR[odeme.status]} (demo)</p>;
}

export function GrupSeansYapilmadi({ grupId }: { grupId: string }) {
  return (
    <div className="space-y-1">
      <OdemeDugmesi tur="grup-yapilmadi" planId={grupId} konusmaId="" />
      <p className="text-xs text-slate-600">
        Seans bitiminden sonraki 48 saat içinde bildirebilirsiniz. Karar yönetici tarafından verilir. <OnayGerekir />
      </p>
    </div>
  );
}

export function SeansYapilmadi({ planId, konusmaId }: { planId: string; konusmaId: string }) {
  return (
    <div className="space-y-1">
      <OdemeDugmesi tur="yapilmadi" planId={planId} konusmaId={konusmaId} />
      <p className="text-xs text-slate-600">
        Seans bitiminden sonraki 48 saat içinde bildirebilirsiniz. Karar yönetici tarafından verilir. <OnayGerekir />
      </p>
    </div>
  );
}
