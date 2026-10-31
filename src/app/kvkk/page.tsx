import { KVKK_SURUMU } from "@/lib/sabitler";

export const metadata = { title: "KVKK Aydınlatma Metni | Danışman Buluşma" };

// TASLAK: Gercek yayindan once bir hukukcu tarafindan hazirlanmali/kontrol edilmeli.
export default function KvkkSayfasi() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-slate-700">
      <h1 className="text-2xl font-bold text-slate-900">KVKK Aydınlatma Metni</h1>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Bu metin bir öğrenci projesi için hazırlanmış <strong>taslaktır</strong> (sürüm {KVKK_SURUMU}).
        Gerçek bir hizmette kullanılmadan önce hukukçu tarafından gözden geçirilmelidir.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-slate-900">Hangi verileri topluyoruz?</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Hesap bilgileri: ad soyad, e-posta adresi, hesap türü.</li>
        <li>Uzmanlar için: unvan veya bölüm bilgisi, onay durumu.</li>
        <li>Başvurular: seçtiğiniz konu (isteğe bağlı) ve uygun zaman aralığı.</li>
      </ul>
      <p>Başvuru sırasında sağlık durumunuzu veya sorununuzu yazmanız istenmez.</p>

      <h2 className="pt-2 text-lg font-semibold text-slate-900">Neden topluyoruz?</h2>
      <p>Hesabınızı oluşturmak, danışan ile uzmanı buluşturmak ve uzmanların belgelerini doğrulamak için.</p>

      <h2 className="pt-2 text-lg font-semibold text-slate-900">Veriler nerede saklanıyor?</h2>
      <p>
        Veriler, Almanya&apos;nın Frankfurt şehrindeki sunucularda saklanır. Bu, yurt dışına veri
        aktarımı anlamına gelir.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-slate-900">Haklarınız</h2>
      <p>
        KVKK&apos;nın 11. maddesi kapsamında verilerinize erişme, düzeltilmesini veya silinmesini
        isteme haklarına sahipsiniz. Başvuru formu ve hesap silme özelliği sonraki aşamada eklenecek.
      </p>
    </article>
  );
}
