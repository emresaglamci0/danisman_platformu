import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";
import { AcilDurumBandi } from "@/components/AcilDurumBandi";
import { UstMenu } from "@/components/UstMenu";

const ALT_MENU = [
  {
    baslik: "Platform",
    baglantilar: [
      { adres: "/hakkimizda", ad: "Hakkımızda" },
      { adres: "/ogrenci-uzmanlar", ad: "Öğrenci Uzmanlar Hakkında" },
      { adres: "/sss", ad: "Sık Sorulan Sorular" },
      { adres: "/iletisim", ad: "İletişim" },
    ],
  },
  {
    baslik: "Yasal",
    baglantilar: [
      { adres: "/kullanim-kosullari", ad: "Kullanım Koşulları" },
      { adres: "/gizlilik", ad: "Gizlilik Politikası" },
      { adres: "/cerezler", ad: "Çerez Bildirimi" },
      { adres: "/kvkk", ad: "KVKK Aydınlatma Metni" },
    ],
  },
];

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
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          <strong>Demo:</strong> Bu site bir portfolyo projesidir. Gerçek bilgilerinizi girmeyin.
        </div>
        <header className="border-b border-slate-200 bg-white">
          <UstMenu rol={kullanici?.rol ?? null} />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>

        <AcilDurumBandi />

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 text-sm text-slate-500 sm:grid-cols-3">
            <p>Bu bir öğrenci projesidir. Gösterilen uzmanlar uydurma test verisidir.</p>
            {ALT_MENU.map((grup) => (
              <nav key={grup.baslik} aria-label={grup.baslik}>
                <p className="mb-2 font-semibold text-slate-700">{grup.baslik}</p>
                <ul className="space-y-1.5">
                  {grup.baglantilar.map((b) => (
                    <li key={b.adres}>
                      <Link href={b.adres} className="hover:text-slate-800">
                        {b.ad}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </footer>
      </body>
    </html>
  );
}
