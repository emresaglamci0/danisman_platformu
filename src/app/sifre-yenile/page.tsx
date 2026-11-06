import { redirect } from "next/navigation";
import { mevcutKullanici } from "@/lib/oturum";
import { YenilemeFormu } from "./YenilemeFormu";

export const metadata = { title: "Şifre Yenile | Danışman Buluşma" };

// E-postadaki baglanti /auth/callback uzerinden oturum acip buraya yonlendirir.
export default async function SifreYenileSayfasi() {
  if (!(await mevcutKullanici())) redirect("/sifremi-unuttum");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Yeni şifre belirleyin</h1>
      <YenilemeFormu />
    </div>
  );
}
