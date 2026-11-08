import type { Alan } from "@/lib/sabitler";

export type Kaynak = { ad: string; url: string };
export type Rahatsizlik = {
  ad: string;
  alan: Alan;
  agir: boolean;
  aciklama: string;
  belirtiler: string[]; // 3-5 sade madde
  yayginlik?: string; // yalnızca kaynakta bulunursa; kaynak ve kapsam metinde
  nedenler: string;
  tedavi: string;
  kaynaklar: Kaynak[];
};
export type His = { ad: string; kartlar: string[] }; // kartlar: Rahatsizlik.ad değerleri

const DSM: Kaynak = { ad: "DSM-5-TR (Amerikan Psikiyatri Birliği, 2022)", url: "https://www.psychiatry.org/psychiatrists/practice/dsm" };
const ICD: Kaynak = { ad: "ICD-11 (Dünya Sağlık Örgütü)", url: "https://icd.who.int/browse/2024-01/mms/en" };
const DSO = (konu: string, yol: string): Kaynak => ({ ad: `Dünya Sağlık Örgütü: ${konu}`, url: `https://www.who.int/news-room/fact-sheets/detail/${yol}` });
const NIMH = (konu: string, yol: string): Kaynak => ({ ad: `NIMH: ${konu}`, url: `https://www.nimh.nih.gov/health/${yol}` });

const ILAC = "Gerekirse psikiyatrist değerlendirmesiyle ilaç tedavisi eklenebilir.";

export const RAHATSIZLIKLAR: Rahatsizlik[] = [
  {
    ad: "Agorafobi",
    alan: "kaygi",
    agir: false,
    aciklama:
      "Kalabalık yerler, toplu taşıma veya evden tek başına çıkmak gibi, kötü bir şey olursa kaçmanın ya da yardım almanın zor olacağı düşünülen durumlardan yoğun korku duyma ve kaçınmadır.",
    belirtiler: [
      "Kalabalık bir yerde ya da otobüste fenalaşırım diye çok korkuyorum.",
      "Evden yalnız çıkmak bana zor geliyor.",
      "Bu yüzden gitmek istediğim yerlerden uzak duruyorum.",
      "Yanımda güvendiğim biri olmadan dışarı çıkamıyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerin yaklaşık %1,3'ü hayatının bir döneminde agorafobi yaşıyor.",
    nedenler:
      "Çoğu zaman panik ataklardan sonra, atağın tekrar olacağı korkusuyla gelişir. Genetik yatkınlık, kaygılı mizaç ve stresli yaşam olayları rol oynayabilir.",
    tedavi:
      "Bilişsel davranışçı terapi (BDT), özellikle korkulan durumlara adım adım ve güvenli biçimde yaklaşmayı (maruz bırakma) içeren çalışmalar etkilidir. " + ILAC,
    kaynaklar: [DSM, NIMH("Agorafobi istatistikleri", "statistics/agoraphobia")],
  },
  {
    ad: "Anksiyete",
    alan: "kaygi",
    agir: false,
    aciklama:
      "Günlük olaylar karşısında uzun süren, kontrol etmesi zor, yoğun kaygı ve endişe halidir. Huzursuzluk, kas gerginliği, uyku ve odaklanma güçlüğü eşlik edebilir.",
    belirtiler: [
      "Neredeyse her konuda endişeleniyorum ve bunu durduramıyorum.",
      "Sürekli gergin ve tetikte hissediyorum.",
      "Omuzlarım, boynum hep kasılı.",
      "Kafam dolu olduğu için uyumakta ve odaklanmakta zorlanıyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerin yaklaşık %5,7'si hayatının bir döneminde yaygın anksiyete bozukluğu yaşıyor.",
    nedenler:
      "Genetik yatkınlık, beyindeki stres sistemlerinin hassasiyeti, kaygılı düşünme alışkanlıkları ve süregelen stres birlikte rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) en çok araştırılmış ve etkili yöntemlerdendir. " + ILAC,
    kaynaklar: [DSM, DSO("Kaygı bozuklukları", "anxiety-disorders"), NIMH("Yaygın anksiyete bozukluğu istatistikleri", "statistics/generalized-anxiety-disorder")],
  },
  {
    ad: "Anoreksiya",
    alan: "yeme",
    agir: true,
    aciklama:
      "Kilo almaktan yoğun korku ve beden algısında bozulmayla birlikte yemeyi ciddi biçimde kısıtlamanın görüldüğü bir yeme bozukluğudur. Bedensel sağlığı ağır biçimde etkileyebildiği için erken destek önemlidir.",
    belirtiler: [
      "Kilo almaktan çok korkuyorum.",
      "Yediklerimi sürekli sayıyor ve kısıtlıyorum.",
      "Başkaları zayıf olduğumu söylese de kendimi kilolu görüyorum.",
      "Yemek yerken suçluluk ve kaygı hissediyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerde yaşam boyu görülme oranı yaklaşık %0,6.",
    nedenler:
      "Genetik yatkınlık, mükemmeliyetçilik gibi kişilik özellikleri, zayıflığı öne çıkaran kültürel baskılar ve stresli yaşam olayları birlikte rol oynar.",
    tedavi:
      "Tedavi çoğunlukla ekiple yapılır: psikoterapi (ergenlerde aile temelli tedavi, yetişkinlerde BDT gibi), beslenme desteği ve tıbbi takip. Bedensel risk yüksekse hastane tedavisi gerekebilir.",
    kaynaklar: [DSM, DSO("Ruhsal bozukluklar", "mental-disorders"), NIMH("Yeme bozuklukları", "topics/eating-disorders")],
  },
  {
    ad: "Beden Disformik Bozukluğu",
    alan: "yeme",
    agir: false,
    aciklama:
      "Kişinin, başkalarının fark etmediği veya çok küçük gördüğü görünüm kusurlarıyla aşırı uğraşmasıdır. Sürekli ayna kontrolü gibi tekrarlayan davranışlar ve belirgin sıkıntı görülebilir.",
    belirtiler: [
      "Görünüşümdeki bir kusuru düşünmeden duramıyorum.",
      "Sık sık aynaya bakıyor ya da aynalardan kaçıyorum.",
      "O kusuru saklamak için çok zaman harcıyorum.",
      "İnsanların bu kusuru fark ettiğini düşünüp utanıyorum.",
    ],
    nedenler:
      "Genetik yatkınlık, beynin ayrıntılara aşırı odaklanma eğilimi, görünüşle ilgili alay veya zorbalık deneyimleri rol oynayabilir. Obsesif kompulsif bozuklukla ilişkili bir durum olarak sınıflanır.",
    tedavi: "Bu soruna uyarlanmış bilişsel davranışçı terapi (BDT) etkilidir. " + ILAC,
    kaynaklar: [DSM, ICD],
  },
  {
    ad: "Bipolar Bozukluk",
    alan: "duygudurum",
    agir: true,
    aciklama:
      "Aşırı yükselmiş ruh hali ve enerji dönemleri (mani veya hipomani) ile çoğu zaman depresyon dönemlerinin görüldüğü bir duygudurum bozukluğudur. Düzenli takip ve tedaviyle yönetilebilir.",
    belirtiler: [
      "Bazı dönemler çok enerjik, az uykuyla idare eden ve durdurulamaz biri oluyorum.",
      "O dönemlerde düşüncelerim çok hızlanıyor, riskli kararlar alabiliyorum.",
      "Bazı dönemler ise çok çökkün ve umutsuz hissediyorum.",
      "Ruh halimdeki bu değişimler işimi ve ilişkilerimi etkiliyor.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre 2023'te dünyada yaklaşık 36 milyon kişi (nüfusun %0,4'ü) bipolar bozuklukla yaşıyordu.",
    nedenler:
      "Kalıtımın güçlü bir rolü vardır. Beyin kimyası ve yapısındaki farklılıklar, uyku düzensizliği ve stresli olaylar dönemleri tetikleyebilir.",
    tedavi:
      "Temel tedavi, psikiyatrist tarafından düzenlenen ilaç tedavisidir (ör. duygudurum düzenleyiciler). Psikoterapi, düzenli uyku ve atakların erken işaretlerini tanımayı öğrenmek tedaviyi destekler.",
    kaynaklar: [DSM, DSO("Bipolar bozukluk", "bipolar-disorder"), NIMH("Bipolar bozukluk", "topics/bipolar-disorder")],
  },
  {
    ad: "Bulimiya",
    alan: "yeme",
    agir: true,
    aciklama:
      "Kontrolsüz yeme atakları ve ardından kilo almamaya yönelik telafi edici davranışlarla seyreden bir yeme bozukluğudur. Kişi çoğu zaman bunu gizler; bedensel sağlığı etkileyebildiği için destek almak önemlidir.",
    belirtiler: [
      "Kısa sürede çok fazla yiyip duramadığım anlar oluyor.",
      "Sonra kusarak, aç kalarak ya da aşırı spor yaparak bunu telafi etmeye çalışıyorum.",
      "Bunu kimseye söyleyemiyor, gizli yapıyorum.",
      "Kendimi değerli hissetmem kilom ve görünüşüme çok bağlı.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerde yaşam boyu görülme oranı yaklaşık %1.",
    nedenler:
      "Genetik yatkınlık, katı diyetler, düşük benlik saygısı, duyguları düzenlemekte güçlük ve zayıflığı öne çıkaran kültürel baskılar rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) en etkili yöntemlerdendir; beslenme desteği ve tıbbi takip eklenir. " + ILAC,
    kaynaklar: [DSM, DSO("Ruhsal bozukluklar", "mental-disorders"), NIMH("Yeme bozuklukları", "topics/eating-disorders")],
  },
  {
    ad: "Cinsel Bozukluklar",
    alan: "cinsel",
    agir: false,
    aciklama:
      "Cinsel istek, uyarılma, orgazm veya ağrıyla ilgili, süreklilik gösteren ve sıkıntı yaratan güçlükleri kapsayan bir gruptur. Hem bedensel hem psikolojik etkenler rol oynayabilir.",
    belirtiler: [
      "Uzun süredir cinsel isteğim çok azaldı ve bu beni üzüyor.",
      "Cinsel ilişki sırasında zorlanıyor ya da ağrı yaşıyorum.",
      "Bu konu yüzünden kaygılanıyor, ilişkiden kaçınıyorum.",
      "Bu durum ilişkimi etkiliyor.",
    ],
    nedenler:
      "Hormonlar, bazı hastalıklar ve ilaçlar gibi bedensel etkenler; kaygı, depresyon, ilişki sorunları, geçmiş olumsuz deneyimler ve öğrenilmiş inançlar gibi psikolojik etkenler birlikte rol oynayabilir.",
    tedavi:
      "Önce bedensel nedenler için hekim değerlendirmesi önerilir. Cinsel terapi, BDT ve çift terapisi sık kullanılan yöntemlerdir; bazı durumlarda ilaç tedavisi eklenebilir.",
    kaynaklar: [DSM, ICD],
  },
  {
    ad: "DEHB (Dikkat Eksikliği ve Hiperaktivite Bozukluğu)",
    alan: "norogelisim",
    agir: false,
    aciklama:
      "Yaşa uygun olmayan dikkat güçlüğü, hareketlilik ve dürtüsellikle kendini gösteren nörogelişimsel bir durumdur. Çocuklukta başlar, yetişkinlikte de sürebilir.",
    belirtiler: [
      "Dikkatimi bir işe uzun süre veremiyorum, çabuk dağılıyorum.",
      "Eşyalarımı ve randevularımı sık sık unutuyorum.",
      "Yerimde durmakta zorlanıyor, içimde bir kıpırtı hissediyorum.",
      "Düşünmeden konuşuyor ya da hareket ediyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de 18-44 yaş arası yetişkinlerde yaşam boyu görülme oranı yaklaşık %8,1.",
    nedenler:
      "Kalıtımın güçlü bir rolü vardır; beynin dikkat ve dürtü kontrolüyle ilgili bölgelerinin gelişimindeki farklılıklar etkilidir. Erken doğum ve gebelikte bazı maddelere maruz kalma riski artırabilir.",
    tedavi:
      "Psikoeğitim, davranışçı yöntemler, yetişkinlerde BDT ve gerekirse psikiyatrist değerlendirmesiyle ilaç tedavisi kullanılır. Okul ve iş ortamında düzenlemeler de yardımcı olur.",
    kaynaklar: [DSM, NIMH("DEHB", "topics/attention-deficit-hyperactivity-disorder-adhd"), NIMH("DEHB istatistikleri", "statistics/attention-deficit-hyperactivity-disorder-adhd")],
  },
  {
    ad: "Depresyon",
    alan: "duygudurum",
    agir: false,
    aciklama:
      "Çoğu gün süren çökkün ruh hali veya eskiden keyif alınan şeylere ilgi kaybıyla giden bir duygudurum bozukluğudur. Uyku, iştah, enerji ve odaklanmada değişiklikler eşlik edebilir.",
    belirtiler: [
      "Çoğu gün kendimi üzgün, boş ya da umutsuz hissediyorum.",
      "Eskiden sevdiğim şeylerden artık keyif almıyorum.",
      "Çok yorgunum, en küçük iş bile gözümde büyüyor.",
      "Uykum ve iştahım değişti.",
      "Kendimi değersiz ya da suçlu hissediyorum.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre 2023'te dünyada nüfusun yaklaşık %4'ü (yetişkinlerin %5,2'si) depresyon yaşadı.",
    nedenler:
      "Genetik yatkınlık, beyin kimyası, kayıp ve stres gibi yaşam olayları, olumsuz düşünme alışkanlıkları ve bedensel hastalıklar birlikte rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) ve kişilerarası terapi gibi psikoterapiler etkilidir. Orta ve ağır durumlarda psikiyatrist değerlendirmesiyle ilaç tedavisi eklenebilir.",
    kaynaklar: [DSM, DSO("Depresyon", "depression"), NIMH("Depresyon", "topics/depression")],
  },
  {
    ad: "Disleksi",
    alan: "norogelisim",
    agir: false,
    aciklama:
      "Zekâ düzeyinden bağımsız olarak okumada, kelimeleri tanımada ve hecelemede güçlük yaratan özgül bir öğrenme güçlüğüdür. Uygun eğitim desteği önemli fark yaratabilir.",
    belirtiler: [
      "Okumak bana hep yavaş ve yorucu geldi.",
      "Harfleri ya da heceleri karıştırıyorum.",
      "Yazarken çok yazım hatası yapıyorum.",
      "Okuduğumu anlamak için tekrar tekrar okumam gerekiyor.",
    ],
    nedenler:
      "Kalıtsal yanı güçlüdür. Beynin dildeki sesleri işleme biçimindeki farklılıklardan kaynaklanır; tembellik veya zekâ eksikliğiyle ilgisi yoktur.",
    tedavi:
      "Sesbilgisi (fonolojik) farkındalığa dayalı, yapılandırılmış okuma eğitimi en etkili yöntemdir. Okulda ek süre gibi düzenlemeler ve duygusal destek yardımcı olur.",
    kaynaklar: [DSM, ICD],
  },
  {
    ad: "Doğum Sonrası Depresyon",
    alan: "duygudurum",
    agir: false,
    aciklama:
      "Gebelikte veya doğumdan sonraki aylarda başlayan depresyondur. Doğumdan sonraki ilk günlerde görülen ve kısa sürede geçen hüzünden daha uzun sürer ve daha yoğundur.",
    belirtiler: [
      "Doğumdan sonra haftalardır kendimi üzgün ve çökkün hissediyorum.",
      "Bebeğime bağlanmakta zorlanıyorum ve bundan suçluluk duyuyorum.",
      "Çok yorgunum ama uyuyamıyorum.",
      "İyi bir anne olamayacağım diye çok endişeleniyorum.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre dünyada gebelerin ve yeni doğum yapmış kadınların %10'undan fazlası depresyon yaşıyor.",
    nedenler:
      "Doğumla gelen hormon değişimleri, uykusuzluk, daha önce depresyon geçirmiş olmak, destek eksikliği ve yeni sorumlulukların getirdiği stres rol oynar.",
    tedavi: "Psikoterapi (BDT, kişilerarası terapi) ve sosyal destek etkilidir. Gerekirse emzirme de göz önüne alınarak psikiyatrist değerlendirmesiyle ilaç tedavisi planlanır.",
    kaynaklar: [DSM, DSO("Depresyon", "depression"), NIMH("Perinatal depresyon", "publications/perinatal-depression")],
  },
  {
    ad: "Hastalık Kaygısı",
    alan: "kaygi",
    agir: false,
    aciklama:
      "Belirgin bir bedensel belirti olmasa veya belirti hafif olsa da ciddi bir hastalığı olduğu ya da olacağı düşüncesiyle yoğun biçimde uğraşmaktır. Güven verici tetkik sonuçlarına rağmen endişe sürebilir.",
    belirtiler: [
      "Ciddi bir hastalığım olduğundan korkuyorum.",
      "Bedenimdeki küçük değişiklikleri sürekli kontrol ediyorum.",
      "Tahlillerim temiz çıksa da içim rahatlamıyor.",
      "İnternette belirtileri araştırmadan duramıyorum.",
    ],
    nedenler:
      "Geçmişte ciddi bir hastalık yaşamak veya yakınında görmek, kaygıya yatkın mizaç ve bedensel duyumları tehlike olarak yorumlama alışkanlığı rol oynayabilir.",
    tedavi: "Bilişsel davranışçı terapi (BDT) etkilidir. " + ILAC,
    kaynaklar: [DSM, ICD],
  },
  {
    ad: "İnsomni",
    alan: "uyku",
    agir: false,
    aciklama:
      "Uyumak için yeterli fırsat olmasına rağmen uykuya dalmada, uykuyu sürdürmede güçlük veya çok erken uyanma ile giden bir uyku bozukluğudur. Gündüz yorgunluğuna ve işlev kaybına yol açabilir.",
    belirtiler: [
      "Yatağa giriyorum ama saatlerce uyuyamıyorum.",
      "Gece sık sık uyanıyorum ya da çok erken uyanıp tekrar uyuyamıyorum.",
      "Gündüz yorgun, sinirli ve dalgın oluyorum.",
      "Uyuyamayacağım diye akşamdan endişelenmeye başlıyorum.",
    ],
    nedenler:
      "Stres, kaygı ve depresyon, düzensiz uyku saatleri, kafein ve ekran alışkanlıkları ile bazı bedensel hastalıklar ve ilaçlar rol oynayabilir. Uykusuzluk kaygısı sorunu sürdürebilir.",
    tedavi: "Uykusuzluk için bilişsel davranışçı terapi (BDT-İ) ilk tercih edilen tedavidir. Uyku ilaçları ise hekim değerlendirmesiyle ve genellikle kısa süreli kullanılır.",
    kaynaklar: [DSM, ICD],
  },
  {
    ad: "Kalıcı Depresif Bozukluk",
    alan: "duygudurum",
    agir: false,
    aciklama:
      "En az iki yıl (çocuk ve ergenlerde bir yıl) süren, çoğu gün görülen çökkün ruh halidir. Belirtiler depresyona göre daha hafif olabilir ama uzun sürdüğü için yaşamı belirgin biçimde etkiler.",
    belirtiler: [
      "Yıllardır kendimi hep biraz mutsuz hissediyorum.",
      "Bunu artık kişiliğimin bir parçası sanıyorum.",
      "Enerjim düşük, kendime güvenim az.",
      "Geleceğe dair umudum zayıf.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerin yaklaşık %2,5'i hayatının bir döneminde kalıcı depresif bozukluk yaşıyor.",
    nedenler: "Depresyona benzer biçimde genetik yatkınlık, beyin kimyası, çocukluk çağı zorlukları ve süregelen stres rol oynar.",
    tedavi: "Psikoterapi (BDT gibi) ve psikiyatrist değerlendirmesiyle ilaç tedavisi; ikisinin birlikte kullanılması çoğu zaman daha etkilidir.",
    kaynaklar: [DSM, NIMH("Kalıcı depresif bozukluk istatistikleri", "statistics/persistent-depressive-disorder-dysthymic-disorder")],
  },
  {
    ad: "Kumar Bozukluğu",
    alan: "bagimlilik",
    agir: true,
    aciklama:
      "Zararlarına rağmen kumar oynamayı kontrol edememe ve sürdürme halidir. Maddeden bağımsız, davranışsal bir bağımlılık olarak sınıflanır; maddi, ailevi ve ruhsal sorunlara yol açabilir.",
    belirtiler: [
      "Kumarı ya da bahsi bırakmak istiyorum ama bırakamıyorum.",
      "Kaybettiğim parayı geri kazanmak için daha çok oynuyorum.",
      "Ne kadar oynadığımı yakınlarımdan saklıyorum.",
      "Oynayamadığımda huzursuz ve sinirli oluyorum.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre tahminler dünyada yetişkinlerin yaklaşık %1,2'sinde kumar bozukluğu olduğunu gösteriyor.",
    nedenler:
      "Beynin ödül sistemi, genetik yatkınlık, dürtüsellik, kumara kolay erişim (çevrimiçi bahis gibi) ve eşlik eden kaygı veya depresyon rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) ve motivasyonel görüşme etkilidir. Kendine yardım grupları ve maddi konularda destek de iyileşmeye katkı sağlar.",
    kaynaklar: [DSM, DSO("Kumar", "gambling")],
  },
  {
    ad: "Madde Kullanımı Bozukluğu",
    alan: "bagimlilik",
    agir: true,
    aciklama:
      "Zararlarını fark etmesine rağmen kişinin madde kullanımını kontrol etmekte zorlanması ve kullanmayı sürdürmesidir. İş, ilişki ve sağlık alanlarını etkileyebilir; tedavi edilebilir bir durumdur.",
    belirtiler: [
      "Kullanmayı azaltmak ya da bırakmak istiyorum ama yapamıyorum.",
      "Aynı etkiyi almak için giderek daha fazlasına ihtiyaç duyuyorum.",
      "Kullanmadığımda bedenim ve ruhum kötü oluyor.",
      "Kullanımım işimi, okulumu ya da ilişkilerimi etkiliyor.",
    ],
    yayginlik:
      "Dünya Sağlık Örgütü'ne göre 2019'da dünyada 15 yaş üstü yaklaşık 400 milyon kişi (%7) alkol kullanım bozukluğuyla yaşıyordu. Bu rakam diğer maddeleri içermez.",
    nedenler:
      "Maddelerin beynin ödül sistemini değiştirmesi, genetik yatkınlık, erken yaşta başlama, travma, eşlik eden ruhsal sorunlar ve çevresel etkenler rol oynar.",
    tedavi:
      "Motivasyonel görüşme, BDT ve aile temelli yaklaşımlar gibi psikososyal tedaviler kullanılır. Bazı maddeler için hekim gözetiminde arınma ve ilaç destekli tedavi gerekir.",
    kaynaklar: [DSM, DSO("Alkol", "alcohol"), NIMH("Madde kullanımı ve ruh sağlığı", "topics/substance-use-and-mental-health")],
  },
  {
    ad: "Narkolepsi",
    alan: "uyku",
    agir: true,
    aciklama:
      "Uyku-uyanıklık düzenini etkileyen nörolojik bir hastalıktır. Gündüz aşırı uykululuk ve karşı konulamayan uyku atakları görülür; bazı kişilerde güçlü duygular sırasında ani kas gücü kaybı olabilir.",
    belirtiler: [
      "Gündüz, yeterince uyusam bile kendimi uyanık tutamıyorum.",
      "Konuşurken ya da çalışırken birden uyuyakalıyorum.",
      "Gülerken veya heyecanlanınca dizlerim boşalabiliyor.",
      "Uykuya dalarken ya da uyanırken hareket edemediğim anlar oluyor.",
    ],
    nedenler:
      "Çoğu durumda, uyanıklığı düzenleyen hipokretin (oreksin) adlı maddeyi üreten beyin hücrelerinin kaybıyla ilişkilidir. Genetik yatkınlık ve bağışıklık sistemiyle ilgili etkenler rol oynayabilir.",
    tedavi:
      "Tanı ve tedavi uyku hekimi veya nörolog tarafından yapılır; ilaç tedavisi ve planlı kısa gündüz uykuları kullanılır. Psikolojik destek, hastalıkla yaşamaya uyum sağlamaya yardımcı olur.",
    kaynaklar: [DSM, ICD],
  },
  {
    ad: "Obsesif Kompulsif Bozukluk",
    alan: "kaygi",
    agir: false,
    aciklama:
      "İstenmeden akla gelen, sıkıntı veren tekrarlayıcı düşünceler (obsesyon) ve bu sıkıntıyı azaltmak için yapılan tekrarlayıcı davranış veya zihinsel eylemlerle (kompulsiyon) kendini gösterir.",
    belirtiler: [
      "Aklımdan atamadığım, beni rahatsız eden düşünceler var.",
      "İçim rahatlasın diye bazı şeyleri tekrar tekrar kontrol ediyor ya da yıkıyorum.",
      "Bunların mantıksız olduğunu bilsem de yapmadan duramıyorum.",
      "Bu düşünce ve davranışlar günümün çok zamanını alıyor.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerde yaşam boyu görülme oranı yaklaşık %2,3.",
    nedenler: "Genetik yatkınlık, beyindeki belirli devrelerin çalışma biçimi ve stresli yaşam olayları rol oynar.",
    tedavi: "Maruz bırakma ve tepki önleme (bir BDT yöntemi) en etkili psikoterapidir. " + ILAC,
    kaynaklar: [DSM, NIMH("Obsesif kompulsif bozukluk", "topics/obsessive-compulsive-disorder-ocd"), NIMH("OKB istatistikleri", "statistics/obsessive-compulsive-disorder-ocd")],
  },
  {
    ad: "Otizm Spektrum Bozukluğu",
    alan: "norogelisim",
    agir: false,
    aciklama:
      "Sosyal iletişim ve etkileşimde farklılıklar, tekrarlayan davranışlar ve sınırlı ilgilerle kendini gösteren, erken çocuklukta başlayan nörogelişimsel bir durumdur. Belirtiler ve destek ihtiyacı kişiden kişiye çok değişir.",
    belirtiler: [
      "Başkalarının ne hissettiğini ya da ima ettiğini anlamakta zorlanıyorum.",
      "Sohbet başlatmak ve sürdürmek bana yorucu geliyor.",
      "Rutinlerim bozulunca çok huzursuz oluyorum.",
      "Ses, ışık ya da dokunuşlara çok hassasım.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre 2021'de dünyada yaklaşık her 127 kişiden 1'inde otizm vardı.",
    nedenler: "Genetik etkenler başta olmak üzere, beyin gelişimini etkileyen birçok etken birlikte rol oynar. Aşıların otizme yol açtığı görüşü bilimsel olarak çürütülmüştür.",
    tedavi:
      "Otizm bir hastalık gibi “iyileştirilmez”; amaç kişinin güçlü yanlarını destekleyip zorlandığı alanlarda beceri kazandırmaktır. Erken müdahale, davranışçı ve iletişim odaklı programlar, gerektiğinde eşlik eden kaygı veya depresyon için terapi kullanılır.",
    kaynaklar: [DSM, DSO("Otizm", "autism-spectrum-disorders"), NIMH("Otizm spektrum bozukluğu", "topics/autism-spectrum-disorders-asd")],
  },
  {
    ad: "Özgül Fobi",
    alan: "kaygi",
    agir: false,
    aciklama:
      "Yükseklik, iğne veya belirli bir hayvan gibi tek bir nesne ya da durum karşısında, gerçek tehlikeyle orantısız yoğun korku duymaktır. Kişi çoğunlukla bu durumdan kaçınır.",
    belirtiler: [
      "Belirli bir şeyden (ör. iğne, yükseklik, bir hayvan) çok korkuyorum.",
      "Onunla karşılaşınca kalbim çarpıyor, kaçmak istiyorum.",
      "Korkumun abartılı olduğunu biliyorum ama engelleyemiyorum.",
      "Bu yüzden bazı yerlerden ve işlerden uzak duruyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerin yaklaşık %12,5'i hayatının bir döneminde özgül fobi yaşıyor.",
    nedenler: "Korkutucu bir deneyim, başkasının korkusunu gözlemleme, genetik yatkınlık ve kaygılı mizaç rol oynayabilir.",
    tedavi: "Korkulan şeye adım adım ve güvenli biçimde yaklaşmayı içeren maruz bırakma terapisi çok etkilidir.",
    kaynaklar: [DSM, NIMH("Özgül fobi istatistikleri", "statistics/specific-phobia")],
  },
  {
    ad: "Panik Bozukluk",
    alan: "kaygi",
    agir: false,
    aciklama:
      "Aniden başlayıp dakikalar içinde doruğa ulaşan yoğun korku nöbetleriyle giden bir bozukluktur. Çarpıntı, nefes darlığı ve titreme görülebilir; kişi yeni bir nöbet geçirmekten korkar.",
    belirtiler: [
      "Birden kalbim çarpmaya, nefesim daralmaya başlıyor.",
      "O an öleceğim ya da kontrolümü kaybedeceğim sanıyorum.",
      "Yeni bir atak geçireceğim diye sürekli tetikteyim.",
      "Atak geçirdiğim yerlere gitmekten kaçınıyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerin yaklaşık %4,7'si hayatının bir döneminde panik bozukluk yaşıyor.",
    nedenler:
      "Genetik yatkınlık, stresli yaşam olayları ve bedensel duyumları (ör. çarpıntı) tehlike işareti olarak yorumlama eğilimi rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) etkilidir. " + ILAC,
    kaynaklar: [DSM, DSO("Kaygı bozuklukları", "anxiety-disorders"), NIMH("Panik bozukluk istatistikleri", "statistics/panic-disorder")],
  },
  {
    ad: "Sosyal Kaygı Bozukluğu",
    alan: "kaygi",
    agir: false,
    aciklama:
      "Başkaları tarafından izlenme, yargılanma veya utanç duyma korkusuyla sosyal ortamlarda yoğun kaygı yaşama ve bu ortamlardan kaçınmadır. Utangaçlıktan daha yoğundur ve günlük yaşamı kısıtlar.",
    belirtiler: [
      "İnsanların beni yargılayacağından çok korkuyorum.",
      "Topluluk önünde konuşmak ya da yeni biriyle tanışmak beni çok geriyor.",
      "Yüzüm kızaracak, sesim titreyecek diye endişeleniyorum.",
      "Bu yüzden davetlerden ve toplantılardan kaçıyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerin yaklaşık %12,1'i hayatının bir döneminde sosyal kaygı bozukluğu yaşıyor.",
    nedenler: "Genetik yatkınlık, çekingen mizaç, alay veya zorbalık gibi olumsuz sosyal deneyimler ve olumsuz değerlendirilme beklentisi rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) en etkili yöntemlerdendir. " + ILAC,
    kaynaklar: [
      DSM,
      NIMH("Sosyal kaygı bozukluğu", "publications/social-anxiety-disorder-more-than-just-shyness"),
      NIMH("Sosyal kaygı bozukluğu istatistikleri", "statistics/social-anxiety-disorder"),
    ],
  },
  {
    ad: "Şizofreni",
    alan: "psikotik",
    agir: true,
    aciklama:
      "Düşünce, algı, duygu ve davranışı etkileyen ciddi bir ruhsal bozukluktur. Gerçekte olmayan şeyleri duyma veya görme (varsanı), gerçeğe uymayan inançlar (sanrı) ve düzensiz konuşma görülebilir; düzenli tedavi önemlidir.",
    belirtiler: [
      "Başkalarının duymadığı sesler duyuyorum.",
      "İnsanların bana karşı bir şeyler planladığından eminim.",
      "Düşüncelerimi toparlamakta ve anlatmakta zorlanıyorum.",
      "Kendimi insanlardan ve eskiden yaptığım şeylerden çektim.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre dünyada yaklaşık her 300 kişiden 1'i (yaklaşık 27 milyon kişi) şizofreniyle yaşıyor.",
    nedenler: "Genetik yatkınlık, beyin gelişimindeki farklılıklar ve çevresel etkenler (ör. ağır stres, ergenlikte esrar kullanımı) birlikte rol oynar.",
    tedavi:
      "Temel tedavi, psikiyatrist tarafından düzenlenen antipsikotik ilaçlardır. Psikoterapi, aile desteği ve işe-okula dönüşü destekleyen programlar iyileşmeye büyük katkı sağlar.",
    kaynaklar: [DSM, DSO("Şizofreni", "schizophrenia"), NIMH("Şizofreni", "topics/schizophrenia")],
  },
  {
    ad: "Tıkınırcasına Yeme Bozukluğu",
    alan: "yeme",
    agir: false,
    aciklama:
      "Kısa sürede çok fazla yemek yeme ve bu sırada kontrolü kaybetme hissiyle giden, tekrarlayan ataklardır. Bulimiyadan farkı, ardından kusma gibi telafi edici davranışların düzenli olarak görülmemesidir.",
    belirtiler: [
      "Bazen aç olmasam da duramadan çok fazla yiyorum.",
      "Yerken kontrolü kaybetmiş gibi hissediyorum.",
      "Utandığım için genelde gizli yiyorum.",
      "Sonrasında kendimi suçlu ve kötü hissediyorum.",
    ],
    yayginlik: "NIMH'e göre ABD'de yetişkinlerde yaşam boyu görülme oranı yaklaşık %2,8.",
    nedenler: "Genetik yatkınlık, sık diyet yapma, olumsuz duygularla baş etmek için yemeye yönelme, düşük benlik saygısı ve stres rol oynar.",
    tedavi: "Bilişsel davranışçı terapi (BDT) en etkili yöntemlerdendir; beslenme desteği eklenir. " + ILAC,
    kaynaklar: [DSM, NIMH("Yeme bozuklukları", "topics/eating-disorders"), NIMH("Yeme bozuklukları istatistikleri", "statistics/eating-disorders")],
  },
  {
    ad: "Travma Sonrası Stres Bozukluğu",
    alan: "travma",
    agir: false,
    aciklama:
      "Çok sarsıcı bir olayı yaşama veya bu olaya tanık olma sonrasında ortaya çıkabilir. Olayı tekrar tekrar yaşama, hatırlatıcılardan kaçınma, olumsuz duygular ve sürekli tetikte olma görülebilir.",
    belirtiler: [
      "Yaşadığım bir olay istemeden aklıma geliyor, rüyalarıma giriyor.",
      "O olayı hatırlatan yer ve kişilerden uzak duruyorum.",
      "Hep tetikteyim, en küçük seste irkiliyorum.",
      "Olaydan beri kendimi insanlardan kopuk hissediyorum.",
    ],
    yayginlik: "Dünya Sağlık Örgütü'ne göre dünya nüfusunun yaklaşık %3,9'u hayatının bir döneminde travma sonrası stres bozukluğu yaşamıştır.",
    nedenler:
      "Sarsıcı olayı yaşayan herkeste gelişmez. Olayın ağırlığı, önceki travmalar, olay sonrası sosyal destek eksikliği ve genetik yatkınlık riski etkiler.",
    tedavi: "Travma odaklı BDT ve EMDR (göz hareketleriyle duyarsızlaştırma ve yeniden işleme) etkili psikoterapilerdir. " + ILAC,
    kaynaklar: [DSM, DSO("Travma sonrası stres bozukluğu", "post-traumatic-stress-disorder"), NIMH("TSSB", "topics/post-traumatic-stress-disorder-ptsd")],
  },
  {
    ad: "Uyum Bozukluğu",
    alan: "travma",
    agir: false,
    aciklama:
      "Ayrılık, taşınma, iş kaybı veya hastalık gibi belirli bir stres kaynağına karşı, beklenenden daha yoğun ya da daha uzun süren duygusal veya davranışsal tepkilerdir. Genellikle stres kaynağından sonraki üç ay içinde başlar.",
    belirtiler: [
      "Hayatımdaki bir değişiklikten beri kendimi toparlayamıyorum.",
      "Sık sık ağlıyor, kaygılanıyor ya da çabuk sinirleniyorum.",
      "İşime, dersime ya da ilişkilerime eskisi gibi odaklanamıyorum.",
      "Bu durumla nasıl baş edeceğimi bilemiyorum.",
    ],
    nedenler:
      "Stres kaynağının ağırlığı, aynı anda birden fazla zorluk yaşamak, baş etme becerileri ve sosyal destek düzeyi tepkinin yoğunluğunu etkiler.",
    tedavi: "Kısa süreli, sorun odaklı psikoterapi ve baş etme becerilerini güçlendiren çalışmalar genellikle yeterlidir; stres kaynağı azaldıkça belirtiler de çoğu zaman azalır.",
    kaynaklar: [DSM, ICD],
  },
]; // Türkçe alfabetik; sırayı test denetler

export const HISLER: His[] = [
  { ad: "Sürekli endişeleniyorum", kartlar: ["Anksiyete", "Hastalık Kaygısı", "Uyum Bozukluğu"] },
  { ad: "Aniden yoğun korku ve çarpıntı yaşıyorum", kartlar: ["Panik Bozukluk", "Agorafobi"] },
  { ad: "Bazı yerlerden ya da şeylerden çok korkuyorum", kartlar: ["Özgül Fobi", "Agorafobi"] },
  { ad: "İnsanların içinde çok geriliyorum", kartlar: ["Sosyal Kaygı Bozukluğu"] },
  { ad: "Aklımdan atamadığım düşünceler", kartlar: ["Obsesif Kompulsif Bozukluk", "Hastalık Kaygısı", "Beden Disformik Bozukluğu"] },
  { ad: "Hiçbir şeyden keyif almıyorum", kartlar: ["Depresyon", "Kalıcı Depresif Bozukluk", "Doğum Sonrası Depresyon"] },
  { ad: "Doğumdan sonra kendimi iyi hissetmiyorum", kartlar: ["Doğum Sonrası Depresyon"] },
  { ad: "Ruh halim aşırı iniş çıkışlar yapıyor", kartlar: ["Bipolar Bozukluk", "Depresyon"] },
  { ad: "Yaşadığım bir olayı unutamıyorum", kartlar: ["Travma Sonrası Stres Bozukluğu", "Uyum Bozukluğu"] },
  { ad: "Yemekle ilişkim bozuldu", kartlar: ["Anoreksiya", "Bulimiya", "Tıkınırcasına Yeme Bozukluğu"] },
  { ad: "Görünüşümden çok rahatsızım", kartlar: ["Beden Disformik Bozukluğu", "Anoreksiya"] },
  { ad: "Uyuyamıyorum", kartlar: ["İnsomni", "Narkolepsi"] },
  { ad: "Bırakmak istiyorum ama bırakamıyorum", kartlar: ["Madde Kullanımı Bozukluğu", "Kumar Bozukluğu"] },
  {
    ad: "Çocukluğumdan beri dikkat, okuma ya da iletişimde zorlanıyorum",
    kartlar: ["DEHB (Dikkat Eksikliği ve Hiperaktivite Bozukluğu)", "Disleksi", "Otizm Spektrum Bozukluğu"],
  },
  { ad: "Başkalarının duymadığı sesler duyuyorum", kartlar: ["Şizofreni"] },
  { ad: "Cinsel hayatımda sorun yaşıyorum", kartlar: ["Cinsel Bozukluklar"] },
];
