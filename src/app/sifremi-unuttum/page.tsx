import Link from "next/link";
import { DurumMesaji } from "@/components/FormParcalari";
import { SifirlamaFormu } from "./SifirlamaFormu";

export const metadata = { title: "Şifremi Unuttum | Danışman Buluşma" };

export default async function SifremiUnuttumSayfasi({ searchParams }: PageProps<"/sifremi-unuttum">) {
  const { gecersiz } = await searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Şifremi unuttum</h1>
        <p className="mt-1 text-sm text-slate-600">
          E-posta adresinizi yazın, şifrenizi yenilemeniz için size bir bağlantı gönderelim. Bağlantıyı
          bu tarayıcıda açın.
        </p>
      </div>
      {gecersiz && (
        <DurumMesaji durum={{ hata: "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin." }} />
      )}
      <SifirlamaFormu />
      <p className="text-sm">
        <Link href="/giris" className="text-teal-800 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </div>
  );
}
