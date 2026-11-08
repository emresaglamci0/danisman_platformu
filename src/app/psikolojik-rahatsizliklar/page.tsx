import { RahatsizlikListesi } from "./RahatsizlikListesi";

export const metadata = { title: "Psikolojik Rahatsızlıklar | Danışman Buluşma" };

export default function PsikolojikRahatsizliklarSayfasi() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Psikolojik Rahatsızlıklar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Açıklamayı görmek için başlığa tıklayın veya dokunun. Buradaki bilgiler genel
          bilgilendirme amaçlıdır; tanı veya tedavi yerine geçmez. Tanı yalnızca yetkili bir uzman
          tarafından konulabilir.
        </p>
      </div>

      <RahatsizlikListesi />
    </div>
  );
}
