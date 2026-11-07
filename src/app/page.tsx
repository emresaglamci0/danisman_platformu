import Link from "next/link";
import { OlcekAlani } from "@/modules/olcek";
import { BasvuruGorseli, UzmanlarGorseli, YanitGorseli } from "@/components/AdimGorselleri";
import { OnayGerekir } from "@/components/OnayGerekir";
import { OnlineGorusme } from "@/components/OnlineGorusme";
import { OturanKadin } from "@/components/OturanKadin";
import { UzmanKarti } from "@/components/UzmanKarti";
import { onGorusmeYapanUzmanlar } from "@/lib/uzmanlar";

const ADIMLAR = [
  {
    baslik: "Uzmanları inceleyin",
    metin: "Belgeleri tek tek kontrol edilmiş uzmanların profillerine göz atın.",
    Gorsel: UzmanlarGorseli,
  },
  {
    baslik: "Başvurun",
    metin: "Size uygun uzmana birkaç seçimle başvurun. Uzun form doldurmazsınız.",
    Gorsel: BasvuruGorseli,
  },
  {
    baslik: "Yanıtı bekleyin",
    metin: "Uzman başvurunuzu kabul ettiğinde panelinizden görürsünüz.",
    Gorsel: YanitGorseli,
  },
];

export default async function AnaSayfa() {
  const onGorusmeUzmanlari = (await onGorusmeYapanUzmanlar()).slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="grid items-center gap-8 py-4 sm:py-10 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
            Doğru uzmanla tanışmanın kolay yolu
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 lg:mx-0">
            Belgeleri onaylanmış psikolog ve psikolojik danışmanlar ile ücretsiz, staj kapsamında
            görüşme yapan son sınıf Psikoloji/PDR öğrencilerini tek yerde bulun. <OnayGerekir />
          </p>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href="/uzmanlar"
              className="rounded-lg bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
            >
              Uzmanları gör
            </Link>
            <OlcekAlani />
          </div>
        </div>
        <OturanKadin />
      </section>

      <section aria-label="Nasıl çalışır" className="rounded-2xl bg-teal-100 p-2 sm:p-4">
        <ol className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          {ADIMLAR.map((adim, i) => (
            <li key={adim.baslik} className="group relative overflow-hidden rounded-xl p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-semibold text-teal-800">
                {i + 1}
              </span>
              <h2 className="mt-3 text-lg font-semibold">{adim.baslik}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{adim.metin}</p>
              {/* Ayni metni tekrar ettigi icin ekran okuyuculardan gizli; dokunmatik ekran ve klavyede bilgi kaybolmaz */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex translate-y-full items-center gap-3 bg-white p-4 transition-transform duration-300 ease-out group-hover:translate-y-0 sm:flex-col sm:items-start lg:flex-row lg:items-center"
              >
                <adim.Gorsel />
                <p className="text-sm leading-relaxed text-slate-700">{adim.metin}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Önce tanış, sonra karar ver.</h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">
              Bazı uzmanlar ücretsiz ön görüşme yapıyor. Çalışmaya başlamadan önce size uygun olup olmadığını
              anlayabilirsiniz.
            </p>
          </div>
          <OnlineGorusme />
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

      <section className="rounded-2xl bg-amber-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold">Gizliliğiniz</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-slate-700">
          Sizden yalnızca gerekli bilgileri istiyoruz. Başvuru formunda sorununuzu yazmanız
          istenmez. Kişisel verilerinizin nasıl işlendiğini{" "}
          <Link href="/kvkk" className="text-teal-800 underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          sayfasında okuyabilirsiniz.
        </p>
      </section>

      <p className="text-center text-sm text-slate-600">
        Danışanlarla buluşmak isteyen bir uzman mısınız?{" "}
        <Link href="/kayit" className="text-teal-800 underline">
          Uzman olarak katıl
        </Link>
      </p>
    </div>
  );
}
