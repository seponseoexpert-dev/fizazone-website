import { supabase } from "@/integrations/supabase/client";

export const SITE_BUCKET = "site-images";

/** Ten years — the bucket is private, so we persist a long-lived signed URL. */
const SIGN_SECONDS = 60 * 60 * 24 * 365 * 10;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Uploads one image to storage and returns a directly usable URL. */
export async function uploadSiteImage(file: File, folder = "content"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image must be smaller than 10MB");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(SITE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(SITE_BUCKET)
    .createSignedUrl(path, SIGN_SECONDS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Could not create image URL");
  return data.signedUrl;
}

export async function uploadSiteImages(files: File[], folder = "content"): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) urls.push(await uploadSiteImage(file, folder));
  return urls;
}
