// Node port of the QR rendering step in components/qr-code/QrCodeLayout.tsx.
// The browser tool uses qr-code-styling for decorative dot/corner shapes,
// frames, and image blends — that library's Node path requires node-canvas
// (native Cairo bindings), which isn't reliably installable without system
// packages. Since decorative styling is a UI extra (already scoped out of
// v1 alongside the "Scan Me" frame and artistic blend, per the app-icon
// plan's precedent), this CLI uses the pure-JS `qrcode` package instead:
// same payload encoders, no native dependency, colors/size/error-correction
// still supported.
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { ToolOutcome } from "./types";
import { getQrType, QrTypeId } from "./qrTypes";

export interface QrOptions {
  type: QrTypeId;
  fields: Record<string, string>;
  outPath: string;
  size?: number; // default 512
  fgColor?: string; // default #000000
  bgColor?: string; // default #ffffff
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"; // default M
}

export async function generateQr(opts: QrOptions): Promise<ToolOutcome> {
  try {
    const typeDef = getQrType(opts.type);
    const data = typeDef.buildPayload(opts.fields);
    if (!data.trim()) {
      return { ok: false, error: `Could not build a QR payload for type "${opts.type}" from the given fields` };
    }

    const buffer = await QRCode.toBuffer(data, {
      type: "png",
      width: opts.size ?? 512,
      margin: 2,
      errorCorrectionLevel: opts.errorCorrectionLevel ?? "M",
      color: {
        dark: opts.fgColor ?? "#000000",
        light: opts.bgColor ?? "#ffffff",
      },
    });

    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, buffer);

    return { ok: true, outputPath: opts.outPath, message: `Generated ${opts.type} QR code -> ${opts.outPath}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
