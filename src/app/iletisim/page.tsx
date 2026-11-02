import { OnayGerekir } from "@/components/OnayGerekir";
import { Bolum, YasalSayfa } from "@/components/YasalSayfa";
import { ILETISIM_EPOSTASI, YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "İletişim | Danışman Buluşma" };

// Bilerek iletisim formu yok: form fazladan veri toplar ve spam korumasi gerektirir.
export default function IletisimSayfasi() {
  return (
    <YasalSayfa baslik="İletişim" guncelleme={YASAL_METIN_TARIHI}>
      <Bolum baslik="E-posta">
        <p>
          <a href={`mailto:${ILETISIM_EPOSTASI}`} className="text-base font-semibold text-teal-800 underline">
            {ILETISIM_EPOSTASI}
          </a>
        </p>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
          Lütfen e-postanıza sağlık durumunuz veya yaşadığınız sorunla ilgili ayrıntı yazmayın.
          Bunları yalnızca uzmanınızla, site içindeki şifreli mesajlaşmada paylaşın.
        </p>
      </Bolum>

      <Bolum baslik="KVKK başvuruları">
        <p>
          Kişisel verilerinizle ilgili haklarınızı kullanmak için yukarıdaki adrese
          &quot;KVKK Başvurusu&quot; konulu bir e-posta gönderebilirsiniz. Başvurunuzun size ait
          olduğunu doğrulamak için ek bilgi istenebilir. <OnayGerekir />
        </p>
      </Bolum>

      <Bolum baslik="Bir sohbeti şikâyet etmek">
        <p>Sohbet ekranındaki şikâyet düğmesini kullanın. Böylece yetkili yönetici sohbeti inceleyebilir.</p>
      </Bolum>

      <Bolum baslik="Acil durumlar">
        <p>
          Bu adres acil durumlar için uygun değildir ve hemen yanıt verilemeyebilir. Acil bir
          durumda{" "}
          <a href="tel:112" className="font-semibold underline">
            112
          </a>
          &apos;yi arayın.
        </p>
      </Bolum>
    </YasalSayfa>
  );
}
