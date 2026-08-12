import { supabase } from "@/integrations/supabase/client";
import type { Photo } from "@/types";

const BUCKET = "wedding-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export type PhotoCategory = "hero" | "gallery" | "story";

export async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (error) throw error;
  return data.signedUrl;
}

export async function listPhotos(coupleId: string, category?: PhotoCategory): Promise<Photo[]> {
  let query = supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("position", { ascending: true });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function uploadPhoto(
  coupleId: string,
  file: File,
  category: PhotoCategory,
  caption?: string,
): Promise<Photo> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${coupleId}/${category}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const url = await signedUrl(path);

  const { data, error } = await supabase
    .from("photos")
    .insert({
      couple_id: coupleId,
      storage_path: path,
      public_url: url,
      caption: caption ?? null,
      category,
      position: 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePhoto(photo: Photo): Promise<void> {
  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) throw error;
}
