import Link from "next/link";

export default function BulunamadiSayfasi() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">Sayfa bulunamadı</h1>
      <p className="text-slate-600">Aradığınız sayfa yok veya kaldırılmış olabilir.</p>
      <Link href="/" className="text-teal-800 underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
