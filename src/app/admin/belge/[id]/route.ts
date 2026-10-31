import { NextResponse, type NextRequest } from "next/server";
import { supabaseSunucu } from "@/lib/supabase/sunucu";
import { BELGE_DEPOSU } from "@/lib/supabase/yonetici";
import { adminKullanici, islemKaydet } from "../../yetki";

// Admin "Görüntüle"ye tikladiginda calisir: 60 saniye gecerli bir link uretip oraya yonlendirir.
// Link admin'in kendi oturumuyla uretilir; veritabani kurallari da yalnizca admin'e izin verir.
export async function GET(_istek: NextRequest, { params }: RouteContext<"/admin/belge/[id]">) {
  const admin = await adminKullanici();
  if (!admin) return new NextResponse("Bulunamadı", { status: 404 });

  const { id } = await params;
  const supabase = await supabaseSunucu();
  const { data: belge } = await supabase
    .from("expert_documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!belge?.storage_path) {
    return new NextResponse("Belge bulunamadı veya inceleme sonrası silindi.", { status: 404 });
  }

  const { data, error } = await supabase.storage.from(BELGE_DEPOSU).createSignedUrl(belge.storage_path, 60);
  if (error || !data) return new NextResponse("Belge açılamadı.", { status: 500 });

  await islemKaydet(admin.id, "belge_goruntule", id);
  return NextResponse.redirect(data.signedUrl, { status: 303 });
}
