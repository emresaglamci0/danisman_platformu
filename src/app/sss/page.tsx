import Link from "next/link";
import { OnayGerekir } from "@/components/OnayGerekir";
import { YasalSayfa } from "@/components/YasalSayfa";
import { ILETISIM_EPOSTASI, YASAL_METIN_TARIHI } from "@/lib/sabitler";

export const metadata = { title: "Sık Sorulan Sorular | Danışman Buluşma" };

const baglanti = "text-teal-800 underline";

// <details> etiketi JavaScript olmadan acilip kapanir.
const SORULAR: { soru: string; yanit: React.ReactNode }[] = [
  {
    soru: "Görüşmeler ücretli mi?",
    yanit: (
      <>
        Öğrenci uzmanlarla yapılan görüşmeler <strong>ücretsizdir</strong>. Bağımsız uzmanlarla
        ücretli görüşme ve site üzerinden ödeme henüz kullanıma açılmamıştır. <OnayGerekir />
      </>
    ),
  },
  {
    soru: "Öğrenci uzman kimdir?",
    yanit: (
      <>
        Son sınıf Psikoloji veya PDR öğrencisidir; lisanslı bir uzman değildir. Ayrıntılar için{" "}
        <Link href="/ogrenci-uzmanlar" className={baglanti}>
          Öğrenci Uzmanlar Hakkında
        </Link>{" "}
        sayfasına bakın.
      </>
    ),
  },
  {
    soru: "Uzmanların belgeleri kontrol ediliyor mu?",
    yanit: "Evet. Profil yayınlanmadan önce site yöneticisi belgeleri tek tek inceler. Karardan sonra belge dosyaları silinir.",
  },
  {
    soru: "Başvururken sorunumu anlatmam gerekiyor mu?",
    yanit: "Hayır. Yalnızca listeden bir konu (isteğe bağlı) ve size uygun zamanı seçersiniz.",
  },
  {
    soru: "Mesajlarımı kim görebilir?",
    yanit: (
      <>
        Mesajlar şifreli saklanır ve varsayılan olarak yalnızca siz ve uzmanınız görebilirsiniz.
        Sohbet şikâyet edilirse yetkili yönetici, sebep yazarak ve sınırlı bir süre için
        inceleyebilir. Ayrıntılar{" "}
        <Link href="/gizlilik" className={baglanti}>
          Gizlilik Politikası
        </Link>
        &apos;nda.
      </>
    ),
  },
  {
    soru: "Görüntülü görüşme var mı?",
    yanit:
      "Sitenin kendi görüntülü görüşme sistemi yok. Uzmanınız sohbette bir Google Meet, Zoom veya Microsoft Teams bağlantısı paylaşabilir. Bu görüşme site dışında, ilgili serviste yapılır.",
  },
  {
    soru: "Uzman başvuruma yanıt vermezse ne olur?",
    yanit: "Başvurunuzun durumunu panelinizden takip edebilirsiniz. Bu sırada başka uzmanlara da başvurabilirsiniz.",
  },
  {
    soru: "Bu platform tanı koyar veya ilaç önerir mi?",
    yanit: (
      <>
        Hayır. Platform yalnızca danışanlarla uzmanları buluşturur. Öğrenci uzmanlar tanı koyamaz
        ve ilaç öneremez. <OnayGerekir />
      </>
    ),
  },
  {
    soru: "Hesabımı ve verilerimi nasıl silerim?",
    yanit: (
      <>
        Panelinizin altındaki &quot;Hesabımı sil&quot; bölümünden silebilirsiniz. Danışan hesabı silinince
        sohbetleri de silinir. Uzman hesabı silinince sohbetler danışanda, uzmanın adı olmadan, salt
        okunur olarak en fazla 6 ay kalır; danışan bunları daha önce silebilir. Açık bir şikayet veya
        inceleme varsa silme, işlem sonuçlanana kadar yapılamaz. Verdiğiniz yıldız puanı adsız gösterilir ve
        hesabınızı silseniz de adsız olarak kalır. <OnayGerekir />{" "}
        Sorun yaşarsanız{" "}
        <a href={`mailto:${ILETISIM_EPOSTASI}`} className={baglanti}>
          {ILETISIM_EPOSTASI}
        </a>{" "}
        adresine yazabilirsiniz.
      </>
    ),
  },
  {
    soru: "Uzmanlar nasıl sıralanıyor?",
    yanit:
      "Bağımsız uzmanlar, danışanların verdiği yıldız puanına göre sıralanır. Az değerlendirme alan uzmanın puanı ortalamaya yakın tutulur; böylece tek bir puan sıralamayı belirlemez. Henüz puanı olmayan uzmanlar ve öğrenci uzmanlar rastgele sıralanır. Uzmanın kaç çalışma alanının sizinkiyle eşleştiği sıralamayı etkilemez.",
  },
  {
    soru: "Acil bir durumdayım, ne yapmalıyım?",
    yanit: (
      <>
        Bu platform acil durum hizmeti değildir. Hemen{" "}
        <a href="tel:112" className="font-semibold underline">
          112
        </a>
        &apos;yi arayın.
      </>
    ),
  },
];

export default function SssSayfasi() {
  return (
    <YasalSayfa baslik="Sık Sorulan Sorular" guncelleme={YASAL_METIN_TARIHI}>
      <div className="divide-y divide-slate-200">
        {SORULAR.map(({ soru, yanit }) => (
          <details key={soru} className="group py-3 first:pt-0 last:pb-0">
            <summary className="cursor-pointer list-none font-medium text-slate-900">
              <span className="mr-2 inline-block text-teal-800 transition-transform group-open:rotate-90">›</span>
              {soru}
            </summary>
            <p className="mt-2 pl-5">{yanit}</p>
          </details>
        ))}
      </div>
    </YasalSayfa>
  );
}
