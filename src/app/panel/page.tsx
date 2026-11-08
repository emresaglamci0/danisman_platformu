import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutKullanici, type Kullanici } from "@/lib/oturum";
import {
  ALANLAR,
  BASVURU_DURUMLARI,
  BELGE_TURLERI,
  ROLLER,
  UYGUN_ZAMANLAR,
  UZMAN_DURUMLARI,
  belgeTurleri,
  tarihYaz,
  type Alan,
  alanlariSuz,
  type BasvuruDurumu,
  type BelgeTuru,
  type UygunZaman,
  type UzmanDurumu,
} from "@/lib/sabitler";
import { fotografLinkleri } from "@/lib/fotograf";
import { uzmanAdlari } from "@/lib/uzmanlar";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { UzmanFotografi } from "@/components/UzmanFotografi";
import { saatEtiketi } from "@/lib/seans-kurallari";
import { BasvuruYanitFormu } from "./BasvuruYanitFormu";
import { BelgeYuklemeFormu } from "./BelgeYuklemeFormu";
import { FotografFormu } from "./FotografFormu";
import { GorusmeBilgileriFormu } from "./GorusmeBilgileriFormu";
import { DanisanGrupSeanslari, UzmanGrupSeanslari } from "./GrupSeanslarim";
import { HaftalikTablo } from "./HaftalikTablo";
import { HesapSilmeFormu } from "./HesapSilmeFormu";
import { onGorusmeTercihiDegistir } from "./islemler";
import { ProfilFormu } from "./ProfilFormu";

export const metadata = { title: "Panelim | Danışman Buluşma" };

type Basvuru = {
  id: string;
  topic: Alan | null;
  availability: UygunZaman | null; // yalnizca eski basvurularda dolu
  requested_start: string | null;
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
        <Link href="/admin" className="text-teal-800 underline">
          Yönetim paneline git
        </Link>
      )}
      {kullanici.rol !== "admin" && <HesapSilmeFormu uzman={kullanici.rol !== "client"} />}
    </div>
  );
}

async function DanisanPaneli({ kullanici }: { kullanici: Kullanici }) {
  const supabase = await supabaseSunucu();
  // Panel acilinca yanitlanan basvurular goruldu sayilir; ust menudeki sayac sifirlanir
  await supabase.rpc("basvurular_goruldu");
  const { data } = await supabase
    .from("applications")
    .select("id, topic, availability, requested_start, status, created_at, expert_id")
    .eq("client_id", kullanici.id)
    .order("created_at", { ascending: false });
  const basvurular = (data ?? []) as (Basvuru & { expert_id: string })[];
  const adlar = await uzmanAdlari(basvurular.map((b) => b.expert_id));

  return (
    <>
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
          <BasvuruSatiri key={b.id} basvuru={b} kisi={adlar.get(b.expert_id) ?? "Uzman artık listede değil"} />
        ))
      )}
    </section>
    <DanisanGrupSeanslari danisanId={kullanici.id} />
    </>
  );
}

async function UzmanPaneli({ kullanici }: { kullanici: Kullanici }) {
  const supabase = await supabaseSunucu();
  const [{ data: profil }, { data: belgeler }, { data }, { data: duzen }] = await Promise.all([
    supabase
      .from("expert_profiles")
      .select(
        "kind, status, verified_until, review_note, photo_path, offers_free_intro, bio, specialties, offers_online, offers_in_person, city, district, session_minutes",
      )
      .eq("id", kullanici.id)
      .single(),
    supabase
      .from("expert_documents")
      .select("doc_type, storage_path, created_at")
      .eq("expert_id", kullanici.id),
    supabase
      .from("applications")
      .select("id, topic, availability, requested_start, status, created_at, profiles(full_name)")
      .eq("expert_id", kullanici.id)
      .order("created_at", { ascending: false }),
    supabase.from("expert_availability").select("weekday, hour").eq("expert_id", kullanici.id),
  ]);
  const basvurular = (data ?? []) as unknown as (Basvuru & { profiles: { full_name: string } | null })[];

  const bugun = new Date().toISOString().slice(0, 10);
  let durum = (profil?.status ?? "pending") as UzmanDurumu;
  if (durum === "approved" && profil?.verified_until && profil.verified_until < bugun) durum = "expired";

  const tur: "independent" | "student" = profil?.kind ?? "independent";
  const yuklenenler = (belgeler ?? []) as { doc_type: BelgeTuru; storage_path: string | null; created_at: string }[];
  const fotoLinkleri = await fotografLinkleri([profil?.photo_path ?? null]);
  const fotoLink = profil?.photo_path ? fotoLinkleri[profil.photo_path] : null;

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Hesap durumu: {UZMAN_DURUMLARI[durum]}</h2>
        {durum === "pending" && (
          <p className="mt-1 text-sm text-slate-600">
            Belgeleriniz yönetici tarafından kontrol edilene kadar uzman listesinde görünmezsiniz.
          </p>
        )}
        {durum === "rejected" && profil?.review_note && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            <strong>Ret sebebi:</strong> {profil.review_note}
            <br />
            Eksikleri giderip belgelerinizi yeniden yükleyebilirsiniz.
          </p>
        )}
        {durum === "expired" && (
          <p className="mt-1 text-sm text-slate-600">
            Onayınızın süresi doldu. Güncel öğrenci belgenizi yükleyerek yeniden onay alabilirsiniz.
          </p>
        )}
        {profil?.verified_until && (
          <p className="mt-1 text-sm text-slate-600">Onay geçerlilik tarihi: {tarihYaz(profil.verified_until)}</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Profil fotoğrafı</h2>
        <div className="flex flex-wrap items-start gap-4">
          <UzmanFotografi link={fotoLink} ad={kullanici.adSoyad} boyut={96} />
          <div className="min-w-0 flex-1">
            <FotografFormu fotografVar={!!profil?.photo_path} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Profil bilgilerim</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Danışanlar bu bilgileri profilinizde görür. Sağlık bilgisi veya danışanlarınızla ilgili
          bilgi yazmayın. Adınız ve unvanınız belgelerinizle doğrulandığı için buradan değiştirilemez.
        </p>
        <ProfilFormu
          tanitim={profil?.bio ?? ""}
          alanlar={alanlariSuz(profil?.specialties ?? [], kullanici.rol === "student_expert")}
          ogrenci={kullanici.rol === "student_expert"}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Görüşme bilgilerim</h2>
        <GorusmeBilgileriFormu
          bilgiler={{
            online: profil?.offers_online ?? true,
            yuzYuze: profil?.offers_in_person ?? false,
            il: profil?.city ?? "",
            ilce: profil?.district ?? "",
            sure: profil?.session_minutes ?? null,
          }}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Uygun saatlerim</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Online seans için müsait olduğunuz saatleri seçin. Bu düzen her hafta tekrar eder. Danışanlar önümüzdeki 4
          haftayı görür, görüşmeniz olan saatler kendiliğinden gizlenir.
        </p>
        <HaftalikTablo secili={(duzen ?? []).map((d) => `${d.weekday}-${d.hour}`)} />
      </section>

      {tur === "independent" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">
            Ücretsiz ön görüşme: {profil?.offers_free_intro ? "Açık" : "Kapalı"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Bu tercih isteğe bağlıdır. Açarsanız hesabınız onaylıyken{" "}
            <Link href="/on-gorusme" className="text-teal-800 underline">
              Ücretsiz Ön Görüşme
            </Link>{" "}
            sayfasında listelenirsiniz ve danışanlardan ön görüşme için ücret istememeyi kabul edersiniz.
            Ön görüşmeyi mesajlaşarak yapabilir veya isterseniz sohbetin içinden bir kez görüntülü
            görüşme bağlantısı yollayabilirsiniz.
          </p>
          <form action={onGorusmeTercihiDegistir} className="mt-3">
            <input type="hidden" name="acik" value={profil?.offers_free_intro ? "false" : "true"} />
            <button className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
              {profil?.offers_free_intro ? "Ön görüşmeyi kapat" : "Ön görüşmeyi aç"}
            </button>
          </form>
        </section>
      )}

      {tur === "independent" && <UzmanGrupSeanslari uzmanId={kullanici.id} />}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Belgelerim</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {belgeTurleri(tur).map((belgeTuru) => {
            const belge = yuklenenler.find((b) => b.doc_type === belgeTuru);
            return (
              <li key={belgeTuru} className="flex flex-wrap justify-between gap-2">
                <span>{BELGE_TURLERI[belgeTuru].ad}</span>
                <span className="text-slate-600">
                  {!belge
                    ? "Yüklenmedi"
                    : belge.storage_path
                      ? `Yüklendi (${tarihYaz(belge.created_at)}), inceleme bekliyor`
                      : `İncelendi (${tarihYaz(belge.created_at)})`}
                </span>
              </li>
            );
          })}
        </ul>
        {durum === "approved" ? (
          <p className="text-sm text-slate-600">
            Hesabınız onaylı. Gizliliğiniz için belge dosyalarınız inceleme sonrası silindi.
          </p>
        ) : (
          <BelgeYuklemeFormu turler={belgeTurleri(tur)} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Gelen başvurular</h2>
        {basvurular.length === 0 ? (
          <p className="text-sm text-slate-600">Henüz başvuru yok.</p>
        ) : (
          basvurular.map((b) => (
            <BasvuruSatiri key={b.id} basvuru={b} kisi={b.profiles?.full_name ?? "Danışan"}>
              {b.status === "pending" && <BasvuruYanitFormu basvuruId={b.id} />}
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
          {basvuru.requested_start
            ? `İstenen saat: ${saatEtiketi(basvuru.requested_start)}`
            : basvuru.availability && UYGUN_ZAMANLAR[basvuru.availability]}{" "}
          · {tarihYaz(basvuru.created_at)}
        </p>
        <p className="mt-1 font-medium text-teal-800">
          {BASVURU_DURUMLARI[basvuru.status]}
          {basvuru.status === "accepted" && (
            <>
              {" · "}
              <Link href="/mesajlar" className="underline">
                Mesajlara git
              </Link>
            </>
          )}
        </p>
      </div>
      {children}
    </div>
  );
}
