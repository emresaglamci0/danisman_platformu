import { UzmanListesi } from "@/components/UzmanListesi";

export const metadata = { title: "Uzmanlar | Danışman Buluşma" };

export default async function UzmanlarSayfasi({ searchParams }: PageProps<"/uzmanlar">) {
  return (
    <UzmanListesi
      tur="independent"
      baslik="Uzmanlar"
      aciklama="Belgeleri yönetici tarafından kontrol edilip onaylanmış psikolog ve psikolojik danışmanlar."
      arama={await searchParams}
    />
  );
}
