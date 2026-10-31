import Link from "next/link";
import { redirect } from "next/navigation";
import { mevcutKullanici } from "@/lib/oturum";
import { GirisFormu } from "./GirisFormu";

export const metadata = { title: "Giriş | Danışman Buluşma" };

export default async function GirisSayfasi() {
  if (await mevcutKullanici()) redirect("/panel");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Giriş yap</h1>
      <GirisFormu />
      <p className="text-sm text-slate-600">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="text-teal-800 underline">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
