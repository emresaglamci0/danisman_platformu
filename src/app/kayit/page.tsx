import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutKullanici } from "@/lib/oturum";
import { KayitFormu } from "./KayitFormu";

export const metadata = { title: "Kayıt ol | Danışman Buluşma" };

export default async function KayitSayfasi() {
  if (await mevcutKullanici()) redirect("/panel");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Kayıt ol</h1>
      <KayitFormu />
      <p className="text-sm text-slate-600">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="text-teal-800 underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
