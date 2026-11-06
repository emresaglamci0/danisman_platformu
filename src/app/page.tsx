import Link from "next/link";
import { OlcekAlani } from "@/modules/olcek";
import { OnayGerekir } from "@/components/OnayGerekir";
import { UzmanKarti } from "@/components/UzmanKarti";
import { onGorusmeYapanUzmanlar } from "@/lib/uzmanlar";

const ADIMLAR = [
  { baslik: "Uzmanları inceleyin", metin: "Belgeleri tek tek kontrol edilmiş uzmanların profillerine göz atın." },
  { baslik: "Başvurun", metin: "Size uygun uzmana birkaç seçimle başvurun. Uzun form doldurmazsınız." },
  { baslik: "Yanıtı bekleyin", metin: "Uzman başvurunuzu kabul ettiğinde panelinizden görürsünüz." },
];

export default async function AnaSayfa() {
  const onGorusmeUzmanlari = (await onGorusmeYapanUzmanlar()).slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="space-y-6 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Doğru uzmanla tanışmanın kolay yolu</h1>
        <p className="mx-auto max-w-2xl text-slate-600">
          Belgeleri onaylanmış psikolog ve psikolojik danışmanlar ile ücretsiz, staj kapsamında
          görüşme yapan son sınıf Psikoloji/PDR öğrencilerini tek yerde bulun. <OnayGerekir />
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/uzmanlar"
            className="rounded-lg bg-teal-700 px-5 py-2.5 font-medium text-black hover:text-white hover:bg-teal-800"
          >
            Uzmanları gör
          </Link>
          <Link
            href="/kayit"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-50"
          >
            Uzman olarak katıl
          </Link>
          <OlcekAlani />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {ADIMLAR.map((adim, i) => (
          <div key={adim.baslik} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-teal-800">{i + 1}. adım</p>
            <h2 className="mt-1 font-semibold">{adim.baslik}</h2>
            <p className="mt-2 text-sm text-slate-600">{adim.metin}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Önce tanış sonra karar ver.</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bazı uzmanlar ücretsiz ön görüşme yapıyor. Çalışmaya başlamadan önce size uygun olup olmadığını
            anlayabilirsiniz.
          </p>
        </div>
        {onGorusmeUzmanlari.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {onGorusmeUzmanlari.map((uzman) => (
              <UzmanKarti key={uzman.id} uzman={uzman} />
            ))}
          </div>
        )}
        <Link href="/on-gorusme" className="inline-block text-sm text-teal-800 underline">
          Ücretsiz ön görüşme hakkında bilgi alın
        </Link>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <h2 className="mb-2 font-semibold text-slate-900">Gizliliğiniz</h2>
        <p>
          Sizden yalnızca gerekli bilgileri istiyoruz. Başvuru formunda sorununuzu yazmanız
          istenmez. Kişisel verilerinizin nasıl işlendiğini{" "}
          <Link href="/kvkk" className="text-teal-800 underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          sayfasında okuyabilirsiniz.
        </p>
      </section>
    </div>
  );
}
