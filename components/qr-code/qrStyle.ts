import type { DotType, CornerSquareType, CornerDotType, ShapeType } from "qr-code-styling";

export type ColorMode = "single" | "gradient";
export type FrameStyleId = "none" | "banner-bottom" | "banner-top" | "brackets" | "phone" | "circle";

export interface QrStyleState {
  // shape + size
  shape: ShapeType;
  size: number;
  margin: number;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";

  // colors
  colorMode: ColorMode;
  fgColor: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientType: "linear" | "radial";
  gradientRotation: number;
  eyeFrameColor: string;
  eyeColor: string;

  // shapes
  dotsType: DotType;
  cornersSquareType: CornerSquareType;
  cornersDotType: CornerDotType;

  // logo
  logoDataUrl: string | null;
  logoSizeRatio: number; // 0.1 - 0.5 of QR width
  logoMargin: number;
  logoEmbedded: boolean; // true = draw on top without punching a hole; false = clear dots behind it

  // frame ("scan me" call-to-action chrome)
  frameStyle: FrameStyleId;
  frameText: string;
  frameFont: string;
  frameColor: string;
  frameTextColor: string;

  // artistic image blend
  artBlendImage: string | null;
  artBlendOpacity: number;
}

export const defaultQrStyle: QrStyleState = {
  shape: "square",
  size: 320,
  margin: 8,
  errorCorrectionLevel: "M",

  colorMode: "single",
  fgColor: "#000000",
  bgColor: "#ffffff",
  gradientFrom: "#2563EB",
  gradientTo: "#7C3AED",
  gradientType: "linear",
  gradientRotation: 45,
  eyeFrameColor: "#000000",
  eyeColor: "#000000",

  dotsType: "square",
  cornersSquareType: "square",
  cornersDotType: "square",

  logoDataUrl: null,
  logoSizeRatio: 0.22,
  logoMargin: 6,
  logoEmbedded: false,

  frameStyle: "none",
  frameText: "SCAN ME",
  frameFont: "Arial",
  frameColor: "#000000",
  frameTextColor: "#ffffff",

  artBlendImage: null,
  artBlendOpacity: 0.35,
};

export const DOT_TYPES: { value: DotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
];

export const CORNER_SQUARE_TYPES: { value: CornerSquareType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
  { value: "dot", label: "Circle" },
  { value: "classy", label: "Classy" },
];

export const CORNER_DOT_TYPES: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
];

export const FRAME_STYLES: { value: FrameStyleId; label: string }[] = [
  { value: "none", label: "None" },
  { value: "banner-bottom", label: "Bottom Banner" },
  { value: "banner-top", label: "Top Banner" },
  { value: "brackets", label: "Corner Brackets" },
  { value: "phone", label: "Phone" },
  { value: "circle", label: "Circle Badge" },
];

export const FONT_OPTIONS = ["Arial", "Georgia", "Courier New", "Verdana", "Trebuchet MS", "Impact"];
