import type { Metadata } from "next";
import { Lora } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { mevcutKullanici } from "@/lib/oturum";
import { supabaseAyarlari } from "@/lib/supabase/ayarlar";
import { ogrenciModuluAktif } from "@/modules/ogrenci/ayar";
import { AcilDurumBandi, AcilDurumSeridi } from "@/components/AcilDurumBandi";
import { UstMenu } from "@/components/UstMenu";
import { DegerlendirmeAlani } from "@/components/DegerlendirmeAlani";

// Yazi dosyasi derleme sirasinda indirilir ve bizim sitemizden sunulur; ziyaretci Google'a baglanmaz.
// Turkce harflerin (ğ, ş, İ) bir kismi "latin-ext" icindedir.
const baslikYazisi = Lora({ subsets: ["latin", "latin-ext"], variable: "--font-lora" });

const ALT_MENU = [
  {
    baslik: "Platform",
    baglantilar: [
      { adres: "/hakkimizda", ad: "Hakkımızda" },
      { adres: "/ogrenci-uzmanlar/hakkinda", ad: "Öğrenci Uzmanlar Hakkında" },
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
  const ogrenciAcik = ogrenciModuluAktif();

  return (
    <html lang="tr" className={`${baslikYazisi.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {!supabaseAyarlari() && (
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
            Veritabanı bağlantısı ayarlanmamış. <code>.env.local</code> dosyasını doldurun (README.md dosyasına bakın).
          </div>
        )}
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
          <strong>Demo:</strong> Bu site bir portfolyo projesidir. Gerçek bilgilerinizi girmeyin.
        </div>
        <AcilDurumSeridi />
        <header className="border-b border-slate-200 bg-white">
          <UstMenu rol={kullanici?.rol ?? null} ogrenciAcik={ogrenciAcik} />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">{children}</main>
        <DegerlendirmeAlani kullanici={kullanici} />

        <AcilDurumBandi />

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm text-slate-500 sm:grid-cols-3">
            <p>Bu bir öğrenci projesidir. Gösterilen uzmanlar uydurma test verisidir.</p>
            {ALT_MENU.map((grup) => (
              <nav key={grup.baslik} aria-label={grup.baslik}>
                <p className="mb-2 font-semibold text-slate-700">{grup.baslik}</p>
                <ul className="space-y-1.5">
                  {grup.baglantilar.filter((b) => ogrenciAcik || !b.adres.startsWith("/ogrenci-uzmanlar")).map((b) => (
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
