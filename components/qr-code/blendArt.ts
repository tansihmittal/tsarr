/**
 * Blends a background image behind/through the QR so the artwork shows
 * through the gaps and darkens under the modules — the practical, fully
 * client-side version of an "artistic QR". This is NOT the same as a real
 * generative model (e.g. a QR-conditioned ControlNet) that paints entirely
 * new pixels which happen to form a valid code — that requires calling an
 * external image-generation API. This instead overlays your real QR modules
 * on top of your photo using a multiply blend, so scannability comes from
 * the QR itself rather than from anything the image contributes.
 *
 * Because the underlying photo adds visual noise, callers should bias
 * toward a high error-correction level when this mode is active.
 */
export function blendArtImage(
  qrCanvas: HTMLCanvasElement,
  image: HTMLImageElement,
  opacity: number
): HTMLCanvasElement {
  const size = qrCanvas.width;
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d")!;

  // cover-fit the image into the square canvas
  const scale = Math.max(size / image.width, size / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, (size - dw) / 2, (size - dh) / 2, dw, dh);

  // fade a soft white wash over the photo so QR modules stay readable
  ctx.fillStyle = `rgba(255,255,255,${1 - opacity})`;
  ctx.fillRect(0, 0, size, size);

  // multiply the QR on top: dark modules darken the photo, light gaps let it show through
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(qrCanvas, 0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  return out;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}
