import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";
import { cikisYap } from "./giris/islemler";

export const metadata: Metadata = {
  title: "Danışman Buluşma",
  description: "Psikolog ve psikolojik danışmanlarla danışanları buluşturan platform (öğrenci projesi).",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const kullanici = await mevcutKullanici();

  return (
    <html lang="tr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {!supabaseAyarlari() && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
            Veritabanı bağlantısı ayarlanmamış. <code>.env.local</code> dosyasını doldurun (README.md dosyasına bakın).
          </div>
        )}
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-teal-800">
              Danışman Buluşma
            </Link>
            <Link href="/uzmanlar" className="text-sm hover:text-teal-800">
              Uzmanlar
            </Link>
            <div className="ml-auto flex items-center gap-4 text-sm">
              {kullanici ? (
                <>
                  <Link href="/panel" className="hover:text-teal-800">
                    Panelim
                  </Link>
                  <form action={cikisYap}>
                    <button className="text-slate-600 hover:text-slate-900">Çıkış</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/giris" className="hover:text-teal-800">
                    Giriş
                  </Link>
                  <Link
                    href="/kayit"
                    className="rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800"
                  >
                    Kayıt ol
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-slate-500">
            <p>Bu bir öğrenci projesidir. Gösterilen uzmanlar uydurma test verisidir.</p>
            <Link href="/kvkk" className="hover:text-slate-800">
              KVKK Aydınlatma Metni
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
