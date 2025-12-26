export interface PolaroidState {
  image: string | null;
  imageWidth: number;
  imageHeight: number;
  // Frame settings
  frameColor: string;
  frameTexture: "smooth" | "paper" | "grain" | "ragged";
  borderWidth: number;
  bottomBorderWidth: number;
  // Caption
  caption: string;
  captionFont: string;
  captionSize: number;
  captionColor: string;
  // Effects
  rotation: number;
  tilt: number;
  shadow: boolean;
  shadowIntensity: number;
  // Filters
  filter: "none" | "vintage" | "sepia" | "bw" | "faded" | "warm" | "cool" | "cpm35" | "fxn" | "hoga" | "nt16" | "fqs" | "grd" | "dClassic" | "135sr" | "golf" | "s67" | "kino" | "ct100" | "portra" | "ektar" | "velvia" | "provia" | "superia" | "gold200" | "ultramax" | "cinestill";
  filterIntensity: number;
  // Light leak overlay
  lightLeak: "none" | "warm" | "cool" | "rainbow" | "subtle" | "orange" | "blue" | "pink" | "vintage";
  vignette: boolean;
  vignetteIntensity: number;
  grain: boolean;
  grainIntensity: number;
  // Manual adjustments
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  sharpness: number;
  blur: number;
  fade: number;
  // Background
  backgroundColor: string;
  backgroundType: "solid" | "gradient" | "transparent";
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
}
