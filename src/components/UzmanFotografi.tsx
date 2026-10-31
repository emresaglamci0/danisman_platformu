// Fotograf varsa gosterir, yoksa varsayilan kisi simgesi gosterir.
export function UzmanFotografi({
  link,
  ad,
  boyut = 64,
}: {
  link?: string | null;
  ad: string;
  boyut?: number;
}) {
  const stil = { width: boyut, height: boyut };

  if (link) {
    return (
      // Imzali link her istekte degistigi icin Next.js'in resim optimizasyonu kullanilmiyor
      // eslint-disable-next-line @next/next/no-img-element
      <img src={link} alt={`${ad} profil fotoğrafı`} style={stil} className="shrink-0 rounded-full object-cover" />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${ad} için fotoğraf yok`}
      style={stil}
      className="flex shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3/5 w-3/5" aria-hidden="true">
        <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.5-8 5.5V21h16v-1.5c0-3-3.6-5.5-8-5.5Z" />
      </svg>
    </span>
  );
}
