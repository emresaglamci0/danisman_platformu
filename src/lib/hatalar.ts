// Supabase'in Ingilizce hata kodlarini kullaniciya gosterilecek Turkce mesajlara cevirir.
// Teknik ayrinti kullaniciya gosterilmez.
const MESAJLAR: Record<string, string> = {
  invalid_credentials: "E-posta veya şifre hatalı.",
  email_not_confirmed: "Önce e-posta adresinize gelen bağlantıyla hesabınızı doğrulayın.",
  user_already_exists: "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  email_exists: "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  weak_password: "Şifre yeterince güçlü değil. Büyük harf, küçük harf, rakam ve simge birlikte kullanın.",
  same_password: "Yeni şifreniz eski şifrenizle aynı olamaz.",
  insufficient_aal: "Bu hesapta önce iki adımlı doğrulamayı tamamlamalısınız.",
  over_email_send_rate_limit: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.",
  over_request_rate_limit: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.",
};

export function turkceHata(kod: string | undefined) {
  return (kod && MESAJLAR[kod]) || "Bir sorun oluştu. Lütfen tekrar deneyin.";
}

export type FormDurumu = { hata?: string; basari?: string; alan?: string };
