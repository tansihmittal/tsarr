import { QrStyleState } from "./qrStyle";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Composites the raw QR canvas onto a larger canvas with the selected
 * "scan me" frame chrome baked in, so downloads/copies include the frame
 * exactly as previewed (not just a CSS overlay that disappears on export).
 */
export function composeQrWithFrame(
  qrCanvas: HTMLCanvasElement,
  style: QrStyleState
): HTMLCanvasElement {
  const { frameStyle, frameText, frameFont, frameColor, frameTextColor } = style;
  const qrSize = qrCanvas.width;

  if (frameStyle === "none") return qrCanvas;

  const pad = Math.round(qrSize * 0.08);
  const bannerH = Math.round(qrSize * 0.18);
  const fontSize = Math.max(14, Math.round(qrSize * 0.075));

  const out = document.createElement("canvas");
  const ctx = out.getContext("2d")!;

  if (frameStyle === "banner-bottom" || frameStyle === "banner-top") {
    out.width = qrSize + pad * 2;
    out.height = qrSize + pad * 2 + bannerH;

    // card background
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 0, 0, out.width, out.height, Math.round(qrSize * 0.04));
    ctx.fill();

    const qrY = frameStyle === "banner-top" ? pad + bannerH : pad;
    ctx.drawImage(qrCanvas, pad, qrY, qrSize, qrSize);

    const bannerY = frameStyle === "banner-top" ? 0 : pad * 2 + qrSize;
    ctx.fillStyle = frameColor;
    if (frameStyle === "banner-top") {
      roundRect(ctx, 0, 0, out.width, bannerH + pad, Math.round(qrSize * 0.04));
    } else {
      roundRect(ctx, 0, bannerY - pad, out.width, bannerH + pad, Math.round(qrSize * 0.04));
    }
    ctx.fill();
    // square off the inner edge so it reads as one continuous banner, not two rounded shapes
    ctx.fillRect(0, frameStyle === "banner-top" ? bannerH - pad : bannerY - pad, out.width, pad * 2);

    ctx.fillStyle = frameTextColor;
    ctx.font = `bold ${fontSize}px ${frameFont}, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textY = frameStyle === "banner-top" ? bannerH / 2 + pad / 2 : bannerY + bannerH / 2;
    ctx.fillText(frameText.slice(0, 20), out.width / 2, textY);
    return out;
  }

  if (frameStyle === "brackets") {
    out.width = qrSize + pad * 2;
    out.height = qrSize + pad * 2 + (frameText ? fontSize * 2 : 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize);

    const bracketLen = qrSize * 0.16;
    const lw = Math.max(3, qrSize * 0.02);
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    const corners: [number, number, number, number][] = [
      [pad, pad, 1, 1],
      [pad + qrSize, pad, -1, 1],
      [pad, pad + qrSize, 1, -1],
      [pad + qrSize, pad + qrSize, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + bracketLen * dy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + bracketLen * dx, cy);
      ctx.stroke();
    }

    if (frameText) {
      ctx.fillStyle = frameTextColor === "#ffffff" ? frameColor : frameTextColor;
      ctx.font = `bold ${fontSize}px ${frameFont}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frameText.slice(0, 20), out.width / 2, pad * 2 + qrSize + fontSize);
    }
    return out;
  }

  if (frameStyle === "phone") {
    const bodyPad = Math.round(qrSize * 0.14);
    const notchH = Math.round(qrSize * 0.06);
    const homeH = Math.round(qrSize * 0.08);
    out.width = qrSize + bodyPad * 2;
    out.height = qrSize + bodyPad * 2 + notchH + homeH + (frameText ? fontSize * 1.6 : 0);

    ctx.fillStyle = frameColor;
    roundRect(ctx, 0, 0, out.width, out.height - (frameText ? fontSize * 1.6 : 0), Math.round(qrSize * 0.12));
    ctx.fill();

    // notch
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, out.width / 2 - qrSize * 0.12, bodyPad * 0.35, qrSize * 0.24, notchH * 0.6, notchH * 0.3);
    ctx.fillStyle = frameColor;
    ctx.fill();

    // screen
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, bodyPad, bodyPad + notchH, qrSize, qrSize, Math.round(qrSize * 0.03));
    ctx.fill();
    ctx.drawImage(qrCanvas, bodyPad, bodyPad + notchH, qrSize, qrSize);

    // home indicator
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, out.width / 2 - qrSize * 0.1, bodyPad + notchH + qrSize + homeH * 0.3, qrSize * 0.2, homeH * 0.15, homeH * 0.08);
    ctx.fill();

    if (frameText) {
      ctx.fillStyle = frameTextColor;
      ctx.font = `bold ${fontSize}px ${frameFont}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frameText.slice(0, 20), out.width / 2, out.height - fontSize * 0.8);
    }
    return out;
  }

  if (frameStyle === "circle") {
    const ringW = Math.round(qrSize * 0.08);
    const diameter = qrSize * 1.32 + ringW * 2;
    out.width = diameter;
    out.height = diameter + (frameText ? fontSize * 2 : 0);

    const cx = diameter / 2;
    const cy = diameter / 2;

    ctx.fillStyle = frameColor;
    ctx.beginPath();
    ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, diameter / 2 - ringW, 0, Math.PI * 2);
    ctx.fill();

    const inset = (diameter - qrSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, diameter / 2 - ringW, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(qrCanvas, inset, inset, qrSize, qrSize);
    ctx.restore();

    if (frameText) {
      ctx.fillStyle = frameTextColor === "#ffffff" ? frameColor : frameTextColor;
      ctx.font = `bold ${fontSize}px ${frameFont}, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frameText.slice(0, 20), diameter / 2, diameter + fontSize);
    }
    return out;
  }

  return qrCanvas;
}
