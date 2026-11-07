import { OnayGerekir } from "@/components/OnayGerekir";
import { paraYaz } from "@/lib/sabitler";
import { iptalIadeli, saatEtiketi, saatParcalari } from "@/lib/seans-kurallari";
import { SEANS_DURUMLARI, type Seans } from "@/lib/seanslar";
import { OdemeAdimi, OdemeDurumu, odemeleriGetir, odemeModuluAktif, SeansYapilmadi } from "@/modules/odeme";
import { GeriCekFormu, IptalFormu, PlanFormu, PlanYanitFormu, SeansBaglantisiFormu } from "./SeansFormlari";

const GUN = 24 * 3_600_000;

export async function SeansBolumu({
  konusmaId,
  seanslar,
  uzmanMi,
  bagimsiz,
  sure,
  yeniPlanAcik,
  istenenSaat,
}: {
  konusmaId: string;
  seanslar: Seans[];
  uzmanMi: boolean;
  bagimsiz: boolean;
  sure: number | null;
  yeniPlanAcik: boolean;
  istenenSaat: string | null;
}) {
  const odemeAcik = bagimsiz && odemeModuluAktif();
  const odemeler = await odemeleriGetir(seanslar.map((s) => s.id));
  const simdi = new Date();
  const enErken = saatParcalari(simdi.toISOString()).tarih;
  const enGec = saatParcalari(new Date(simdi.getTime() + 28 * GUN).toISOString()).tarih;
  const ilk = saatParcalari(
    istenenSaat && new Date(istenenSaat) > simdi ? istenenSaat : new Date(simdi.getTime() + GUN).toISOString(),
  );
  const ilkSaat = ilk.saat >= 8 && ilk.saat <= 21 ? ilk.saat : 10;

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <h2 className="font-semibold">{bagimsiz ? "Planlar ve seanslar" : "Seans randevuları"}</h2>
      {seanslar.length === 0 && (
        <p className="text-slate-600">
          {uzmanMi ? "Henüz bir şey yollamadınız." : "Uzmanınız bir saat yolladığında burada görünür."}
        </p>
      )}
      {seanslar.map((s) => {
        const odeme = odemeler.get(s.id);
        const basladi = new Date(s.starts_at) <= simdi;
        const bitti = new Date(s.ends_at) <= simdi;
        return (
          <article key={s.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
            <p className="font-medium">{saatEtiketi(s.starts_at)}</p>
            <p className="text-slate-600">
              {Math.round((new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60_000)} dakika · Online
              {s.price_kurus !== null && ` · Seans başı ücret: ${paraYaz(s.price_kurus)}`}
            </p>
            <p className="font-medium text-teal-800">{SEANS_DURUMLARI[s.status]}</p>

            {odeme && <OdemeDurumu odeme={odeme} uzmanMi={uzmanMi} />}

            {s.status === "sent" && odemeAcik && !uzmanMi && (
              <p className="text-slate-600">
                Site içi ödemede saat güvencesi ve iade hakkınız vardır. <OnayGerekir />
              </p>
            )}
            {s.status === "sent" && !uzmanMi && <PlanYanitFormu planId={s.id} konusmaId={konusmaId} />}
            {s.status === "sent" && uzmanMi && <GeriCekFormu planId={s.id} konusmaId={konusmaId} />}

            {s.status === "awaiting_payment" && !uzmanMi && s.price_kurus !== null && (
              <>
                {odemeAcik && <OdemeAdimi planId={s.id} konusmaId={konusmaId} tutar={s.price_kurus} />}
                <PlanYanitFormu planId={s.id} konusmaId={konusmaId} redYalniz />
              </>
            )}

            {s.status === "confirmed" && !bitti && !uzmanMi && s.meeting_url && (
              <a
                href={s.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800"
              >
                Görüşmeye katıl
              </a>
            )}
            {s.status === "confirmed" && !bitti && !uzmanMi && !s.meeting_url && (
              <p className="text-slate-600">Uzmanınız görüşme bağlantısını burada paylaşacak.</p>
            )}
            {s.status === "confirmed" && !bitti && uzmanMi && (
              <SeansBaglantisiFormu planId={s.id} konusmaId={konusmaId} baglanti={s.meeting_url ?? ""} />
            )}

            {s.status === "confirmed" && !basladi && (
              <div>
                <IptalFormu
                  planId={s.id}
                  konusmaId={konusmaId}
                  aciklama={iptalAciklamasi(uzmanMi, s, simdi, bagimsiz && !!odeme)}
                />
                {odeme && <OnayGerekir />}
              </div>
            )}

            {basladi && !uzmanMi && odeme?.status === "held" && (
              <SeansYapilmadi planId={s.id} konusmaId={konusmaId} />
            )}
          </article>
        );
      })}
      {uzmanMi && yeniPlanAcik && sure && (
        <PlanFormu
          konusmaId={konusmaId}
          bagimsiz={bagimsiz}
          sure={sure}
          ilkTarih={ilk.tarih}
          ilkSaat={ilkSaat}
          enErken={enErken}
          enGec={enGec}
        />
      )}
      {uzmanMi && yeniPlanAcik && !sure && (
        <p className="text-slate-600">Yollamak için önce panelinizden seans süresini belirtin.</p>
      )}
    </section>
  );
}

function iptalAciklamasi(uzmanMi: boolean, seans: Seans, simdi: Date, odemeVar: boolean) {
  if (!odemeVar) return "İptal ederseniz saat yeniden açılır.";
  return iptalIadeli(uzmanMi ? "expert" : "client", seans.starts_at, simdi)
    ? "İptal ederseniz saat yeniden açılır ve demo ödeme iade edilmiş sayılır."
    : "Seansa 24 saatten az kaldığı için iptal ederseniz iade yapılmaz. Saat yeniden açılır.";
}
