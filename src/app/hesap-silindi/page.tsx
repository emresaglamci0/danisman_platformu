import Link from "next/link";

export const metadata = { title: "Hesabınız Silindi | Danışman Buluşma" };

export default function HesapSilindiSayfasi() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-bold">Hesabınız silindi</h1>
      <p className="text-sm text-slate-600">Hesabınız ve bağlı verileriniz kalıcı olarak silindi.</p>
      <Link href="/" className="text-teal-800 underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
