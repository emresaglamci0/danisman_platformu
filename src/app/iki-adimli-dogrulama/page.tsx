import { notFound, redirect } from "next/navigation";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { KodFormu } from "./KodFormu";
import { KurulumAlani } from "./KurulumAlani";

export const metadata = { title: "İki adımlı doğrulama | Danışman Buluşma" };

// Admin paneline girmeden once: ilk seferde kurulum, sonraki her giriste 6 haneli kod.
export default async function IkiAdimliSayfasi() {
  const kullanici = await mevcutKullanici();
  if (!kullanici) redirect("/giris");
  if (kullanici.rol !== "admin") notFound();
  if (kullanici.aal === "aal2") redirect("/admin");

  const supabase = await supabaseSunucu();
  const { data } = await supabase.auth.mfa.listFactors();
  const faktor = data?.totp?.[0];

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İki adımlı doğrulama</h1>
        <p className="mt-1 text-sm text-slate-600">
          Yönetim paneli yalnızca telefonunuzdaki doğrulama uygulamasının ürettiği kodla açılır.
          Şifreniz çalınsa bile bu kod olmadan kimse yönetici işlemi yapamaz.
        </p>
      </div>
      {faktor ? <KodFormu faktorId={faktor.id} /> : <KurulumAlani />}
    </div>
  );
}
