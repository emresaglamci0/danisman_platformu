import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutKullanici, type Kullanici } from "@/lib/oturum";
import {
  ALANLAR,
  BASVURU_DURUMLARI,
  ROLLER,
  UYGUN_ZAMANLAR,
  UZMAN_DURUMLARI,
  tarihYaz,
  type Alan,
  type BasvuruDurumu,
  type UygunZaman,
  type UzmanDurumu,
} from "@/lib/sabitler";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { basvuruYanitla } from "./islemler";

export const metadata = { title: "Panelim | Danışman Buluşma" };

type Basvuru = {
  id: string;
  topic: Alan | null;
  availability: UygunZaman;
  status: BasvuruDurumu;
  created_at: string;
};

export default async function PanelSayfasi() {
  const kullanici = await mevcutKullanici();
  if (!kullanici) redirect("/giris");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Merhaba, {kullanici.adSoyad}</h1>
        <p className="text-sm text-slate-600">Hesap türü: {ROLLER[kullanici.rol]}</p>
      </div>
      {kullanici.rol === "client" && <DanisanPaneli kullanici={kullanici} />}
      {(kullanici.rol === "expert" || kullanici.rol === "student_expert") && (
        <UzmanPaneli kullanici={kullanici} />
      )}
      {kullanici.rol === "admin" && (
        <p className="text-sm text-slate-600">Yönetici paneli bir sonraki aşamada eklenecek.</p>
      )}
    </div>
  );
}

async function DanisanPaneli({ kullanici }: { kullanici: Kullanici }) {
  const supabase = await supabaseSunucu();
  const { data } = await supabase
    .from("applications")
    .select("id, topic, availability, status, created_at, expert_profiles(display_name)")
    .eq("client_id", kullanici.id)
    .order("created_at", { ascending: false });
  const basvurular = (data ?? []) as unknown as (Basvuru & { expert_profiles: { display_name: string } | null })[];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Başvurularım</h2>
      {basvurular.length === 0 ? (
        <p className="text-sm text-slate-600">
          Henüz başvurunuz yok.{" "}
          <Link href="/uzmanlar" className="text-teal-800 underline">
            Uzmanlara göz atın
          </Link>
          .
        </p>
      ) : (
        basvurular.map((b) => (
          <BasvuruSatiri key={b.id} basvuru={b} kisi={b.expert_profiles?.display_name ?? "Uzman artık listede değil"} />
        ))
      )}
    </section>
  );
}

async function UzmanPaneli({ kullanici }: { kullanici: Kullanici }) {
  const supabase = await supabaseSunucu();
  const [{ data: profil }, { data }] = await Promise.all([
    supabase.from("expert_profiles").select("status, verified_until").eq("id", kullanici.id).single(),
    supabase
      .from("applications")
      .select("id, topic, availability, status, created_at, profiles(full_name)")
      .eq("expert_id", kullanici.id)
      .order("created_at", { ascending: false }),
  ]);
  const basvurular = (data ?? []) as unknown as (Basvuru & { profiles: { full_name: string } | null })[];
  const durum = (profil?.status ?? "pending") as UzmanDurumu;

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Hesap durumu: {UZMAN_DURUMLARI[durum]}</h2>
        {durum === "pending" && (
          <p className="mt-1 text-sm text-slate-600">
            Belgeleriniz yönetici tarafından kontrol edilene kadar uzman listesinde görünmezsiniz.
            Belge yükleme bir sonraki aşamada eklenecek.
          </p>
        )}
        {profil?.verified_until && (
          <p className="mt-1 text-sm text-slate-600">Onay geçerlilik tarihi: {tarihYaz(profil.verified_until)}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Gelen başvurular</h2>
        {basvurular.length === 0 ? (
          <p className="text-sm text-slate-600">Henüz başvuru yok.</p>
        ) : (
          basvurular.map((b) => (
            <BasvuruSatiri key={b.id} basvuru={b} kisi={b.profiles?.full_name ?? "Danışan"}>
              {b.status === "pending" && (
                <form action={basvuruYanitla} className="flex gap-2">
                  <input type="hidden" name="basvuruId" value={b.id} />
                  <button
                    name="karar"
                    value="accepted"
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
                  >
                    Kabul et
                  </button>
                  <button
                    name="karar"
                    value="rejected"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Reddet
                  </button>
                </form>
              )}
            </BasvuruSatiri>
          ))
        )}
      </section>
    </>
  );
}

function BasvuruSatiri({
  basvuru,
  kisi,
  children,
}: {
  basvuru: Basvuru;
  kisi: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm">
        <p className="font-medium">{kisi}</p>
        <p className="text-slate-600">
          {basvuru.topic ? ALANLAR[basvuru.topic] : "Konu belirtilmedi"} ·{" "}
          {UYGUN_ZAMANLAR[basvuru.availability]} · {tarihYaz(basvuru.created_at)}
        </p>
        <p className="mt-1 font-medium text-teal-800">{BASVURU_DURUMLARI[basvuru.status]}</p>
      </div>
      {children}
    </div>
  );
}
