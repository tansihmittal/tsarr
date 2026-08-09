/**
 * Converts a HEIC/HEIF file to PNG using heic2any.
 * Returns the original file unchanged for all other formats.
 * Only runs client-side (no-ops on server).
 */
export async function normalizeImageFile(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) return file;

  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/png", quality: 1 });
    const result = Array.isArray(blob) ? blob[0] : blob;
    const baseName = file.name.replace(/\.(heic|heif)$/i, "");
    return new File([result], `${baseName}.png`, { type: "image/png" });
  } catch {
    // If conversion fails, return original — the canvas will show an error
    return file;
  }
}

/** Accepted MIME types and extensions for all image file inputs. */
export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif,image/bmp,image/svg+xml,image/tiff,image/x-tiff,image/heic,image/heif,.heic,.heif,.tif,.tiff";
