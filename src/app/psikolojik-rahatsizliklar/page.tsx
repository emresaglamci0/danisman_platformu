import { RahatsizlikKarti } from "./RahatsizlikKarti";

export const metadata = { title: "Psikolojik Rahatsızlıklar | Danışman Buluşma" };

const RAHATSIZLIKLAR = [
  {
    ad: "Anksiyete",
    aciklama:
      "Günlük olaylar karşısında uzun süren, kontrol etmesi zor, yoğun kaygı ve endişe halidir. Huzursuzluk, kas gerginliği, uyku ve odaklanma güçlüğü eşlik edebilir.",
  },
  {
    ad: "Anoreksiya",
    aciklama:
      "Kilo almaktan yoğun korku ve beden algısında bozulmayla birlikte yemeyi ciddi biçimde kısıtlamanın görüldüğü bir yeme bozukluğudur. Bedensel sağlığı ağır biçimde etkileyebildiği için erken destek önemlidir.",
  },
  {
    ad: "Beden Disformik Bozukluğu",
    aciklama:
      "Kişinin, başkalarının fark etmediği veya çok küçük gördüğü görünüm kusurlarıyla aşırı uğraşmasıdır. Sürekli ayna kontrolü gibi tekrarlayan davranışlar ve belirgin sıkıntı görülebilir.",
  },
  {
    ad: "Bipolar Bozukluk",
    aciklama:
      "Aşırı yükselmiş ruh hali ve enerji dönemleri (mani veya hipomani) ile çoğu zaman depresyon dönemlerinin görüldüğü bir duygudurum bozukluğudur. Düzenli takip ve tedaviyle yönetilebilir.",
  },
  {
    ad: "Bulimiya",
    aciklama:
      "Kontrolsüz yeme atakları ve ardından kilo almamaya yönelik telafi edici davranışlarla seyreden bir yeme bozukluğudur. Kişi çoğu zaman bunu gizler; bedensel sağlığı etkileyebildiği için destek almak önemlidir.",
  },
  {
    ad: "Cinsel Bozukluklar",
    aciklama:
      "Cinsel istek, uyarılma, orgazm veya ağrıyla ilgili, süreklilik gösteren ve sıkıntı yaratan güçlükleri kapsayan bir gruptur. Hem bedensel hem psikolojik etkenler rol oynayabilir.",
  },
  {
    ad: "DEHB (Dikkat Eksikliği ve Hiperaktivite Bozukluğu)",
    aciklama:
      "Yaşa uygun olmayan dikkat güçlüğü, hareketlilik ve dürtüsellikle kendini gösteren nörogelişimsel bir durumdur. Çocuklukta başlar, yetişkinlikte de sürebilir.",
  },
  {
    ad: "Depresyon",
    aciklama:
      "Çoğu gün süren çökkün ruh hali veya eskiden keyif alınan şeylere ilgi kaybıyla giden bir duygudurum bozukluğudur. Uyku, iştah, enerji ve odaklanmada değişiklikler eşlik edebilir.",
  },
  {
    ad: "Disleksi",
    aciklama:
      "Zekâ düzeyinden bağımsız olarak okumada, kelimeleri tanımada ve hecelemede güçlük yaratan özgül bir öğrenme güçlüğüdür. Uygun eğitim desteği önemli fark yaratabilir.",
  },
  {
    ad: "Hastalık Kaygısı",
    aciklama:
      "Belirgin bir bedensel belirti olmasa veya belirti hafif olsa da ciddi bir hastalığı olduğu ya da olacağı düşüncesiyle yoğun biçimde uğraşmaktır. Güven verici tetkik sonuçlarına rağmen endişe sürebilir.",
  },
  {
    ad: "İnsomni",
    aciklama:
      "Uyumak için yeterli fırsat olmasına rağmen uykuya dalmada, uykuyu sürdürmede güçlük veya çok erken uyanma ile giden bir uyku bozukluğudur. Gündüz yorgunluğuna ve işlev kaybına yol açabilir.",
  },
  {
    ad: "Madde Kullanımı Bozukluğu",
    aciklama:
      "Zararlarını fark etmesine rağmen kişinin madde kullanımını kontrol etmekte zorlanması ve kullanmayı sürdürmesidir. İş, ilişki ve sağlık alanlarını etkileyebilir; tedavi edilebilir bir durumdur.",
  },
  {
    ad: "Narkolepsi",
    aciklama:
      "Uyku-uyanıklık düzenini etkileyen nörolojik bir hastalıktır. Gündüz aşırı uykululuk ve karşı konulamayan uyku atakları görülür; bazı kişilerde güçlü duygular sırasında ani kas gücü kaybı olabilir.",
  },
  {
    ad: "Obsesif Kompulsif Bozukluk",
    aciklama:
      "İstenmeden akla gelen, sıkıntı veren tekrarlayıcı düşünceler (obsesyon) ve bu sıkıntıyı azaltmak için yapılan tekrarlayıcı davranış veya zihinsel eylemlerle (kompulsiyon) kendini gösterir.",
  },
  {
    ad: "Otizm Spektrum Bozukluğu",
    aciklama:
      "Sosyal iletişim ve etkileşimde farklılıklar, tekrarlayan davranışlar ve sınırlı ilgilerle kendini gösteren, erken çocuklukta başlayan nörogelişimsel bir durumdur. Belirtiler ve destek ihtiyacı kişiden kişiye çok değişir.",
  },
  {
    ad: "Özgül Fobi",
    aciklama:
      "Yükseklik, iğne veya belirli bir hayvan gibi tek bir nesne ya da durum karşısında, gerçek tehlikeyle orantısız yoğun korku duymaktır. Kişi çoğunlukla bu durumdan kaçınır.",
  },
  {
    ad: "Panik Bozukluk",
    aciklama:
      "Aniden başlayıp dakikalar içinde doruğa ulaşan yoğun korku nöbetleriyle giden bir bozukluktur. Çarpıntı, nefes darlığı ve titreme görülebilir; kişi yeni bir nöbet geçirmekten korkar.",
  },
  {
    ad: "Şizofreni",
    aciklama:
      "Düşünce, algı, duygu ve davranışı etkileyen ciddi bir ruhsal bozukluktur. Gerçekte olmayan şeyleri duyma veya görme (varsanı), gerçeğe uymayan inançlar (sanrı) ve düzensiz konuşma görülebilir; düzenli tedavi önemlidir.",
  },
  {
    ad: "Travma Sonrası Stres Bozukluğu",
    aciklama:
      "Çok sarsıcı bir olayı yaşama veya bu olaya tanık olma sonrasında ortaya çıkabilir. Olayı tekrar tekrar yaşama, hatırlatıcılardan kaçınma, olumsuz duygular ve sürekli tetikte olma görülebilir.",
  },
].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

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

      <ul className="grid items-start gap-3 sm:grid-cols-2">
        {RAHATSIZLIKLAR.map((r) => (
          <RahatsizlikKarti key={r.ad} ad={r.ad} aciklama={r.aciklama} />
        ))}
      </ul>
    </div>
  );
}
