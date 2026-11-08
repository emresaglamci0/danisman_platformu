import Link from "next/link";
import { OnayGerekir } from "@/components/OnayGerekir";
import { UzmanListesi } from "@/components/UzmanListesi";

export const metadata = { title: "Öğrenci Uzmanlar | Danışman Buluşma" };

export default async function OgrenciUzmanlarSayfasi({ searchParams }: PageProps<"/ogrenci-uzmanlar">) {
  return (
    <UzmanListesi
      tur="student"
      baslik="Öğrenci Uzmanlar"
      aciklama={
        <>
          Staj kapsamında ücretsiz görüşme yapan PDR 4. sınıf ve Klinik Psikoloji yüksek lisans öğrencileri.
          Lisanslı uzman değildirler. <OnayGerekir />{" "}
          <Link href="/ogrenci-uzmanlar/hakkinda" className="text-teal-800 underline">
            Ayrıntılar
          </Link>
        </>
      }
      arama={await searchParams}
    />
  );
}
