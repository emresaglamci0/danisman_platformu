import Link from "next/link";
import { AcilirKutu } from "@/components/AcilirKutu";
import {
  KararCizimi,
  MeditasyonSeridi,
  NasilCizimi,
  SoruCizimi,
  TanismaCizimi,
} from "@/components/OnGorusmeCizimleri";
import { UzmanKarti } from "@/components/UzmanKarti";
import { onGorusmeYapanUzmanlar } from "@/lib/uzmanlar";

export const metadata = { title: "Ücretsiz Ön Görüşme | Danışman Buluşma" };

const FAYDALAR = [
  {
    baslik: "Uzmanı tanırsınız",
    cizim: <TanismaCizimi />,
    metin: "Uzmanın nasıl çalıştığını öğrenir, kendinizi rahat hissedip hissetmediğinizi görürsünüz.",
  },
  {
    baslik: "Sorularınızı sorarsınız",
    cizim: <SoruCizimi />,
    metin: "Çalışma şekli ve süreç hakkında merak ettiklerinizi, karar vermeden önce sorabilirsiniz.",
  },
  {
    baslik: "Kararı siz verirsiniz",
    cizim: <KararCizimi />,
    metin: "Ön görüşmeden sonra devam etmek zorunda değilsiniz. Size uymadıysa başka bir uzmana başvurabilirsiniz.",
  },
];

export default async function OnGorusmeSayfasi() {
  const uzmanlar = await onGorusmeYapanUzmanlar();

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ücretsiz Ön Görüşme</h1>
          <p className="mt-1 text-sm text-slate-600">
            Buradaki uzmanlar, kendi tercihleriyle ücretsiz ön görüşme yapıyor. Bu tercih her uzman için
            isteğe bağlıdır.
          </p>
        </div>

        {uzmanlar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Şu an ücretsiz ön görüşme yapan uzman yok.{" "}
            <Link href="/uzmanlar" className="text-teal-800 underline">
              Tüm uzmanlara göz atın
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uzmanlar.map((uzman) => (
              <UzmanKarti key={uzman.id} uzman={uzman} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Önce tanış, sonra karar ver.</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ücretsiz ön görüşme, bir uzmanla çalışmaya başlamadan önce onun size uygun olup olmadığını
            anlamanızı sağlar.
          </p>
        </div>

        <div className="grid items-start gap-4 sm:grid-cols-3">
          {FAYDALAR.map((fayda) => (
            <AcilirKutu key={fayda.baslik} baslik={fayda.baslik} cizim={fayda.cizim}>
              <p>{fayda.metin}</p>
            </AcilirKutu>
          ))}
        </div>

        <AcilirKutu baslik="Nasıl yapılır?" cizim={<NasilCizimi />}>
          <p>
            Uzmanın profilinden, size uygun bir saat seçerek başvurursunuz. Bu saat bir istektir. Uzman
            başvurunuzu kabul edince ön görüşmeyi sitedeki mesajlaşma üzerinden veya uzmanın sohbetten bir
            kez yollayabildiği görüntülü görüşme bağlantısıyla yaparsınız. Ön görüşme bir tanışma sohbetidir; tanı konulan veya tedavi
            uygulanan bir seans değildir.
          </p>
          <p>
            Stajyer öğrencilerle yapılan görüşmeler zaten ücretsizdir.{" "}
            <Link href="/uzmanlar?tur=student" className="text-teal-800 underline">
              Stajyer öğrencileri görün
            </Link>
            .
          </p>
        </AcilirKutu>
      </section>

      <MeditasyonSeridi />
    </div>
  );
}
