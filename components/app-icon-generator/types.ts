export interface AppIconGeneratorState {
  image: string | null;
  imageWidth: number;
  imageHeight: number;
  backgroundColor: string;
  padding: number; // percent inset, 0-20
  roundedPreview: boolean;
  platforms: {
    ios: boolean;
    android: boolean;
    web: boolean;
    macos: boolean;
  };
}

export const defaultAppIconState: AppIconGeneratorState = {
  image: null,
  imageWidth: 0,
  imageHeight: 0,
  backgroundColor: "#ffffff",
  padding: 0,
  roundedPreview: true,
  platforms: {
    ios: true,
    android: true,
    web: true,
    macos: true,
  },
};

// ---------- iOS: Xcode AppIcon.appiconset ----------
// Every entry the standard Contents.json enumerates. Several idiom/scale
// combinations land on the same pixel size (e.g. iphone 60pt@2x and
// ipad 76pt@2x@... no — 120 vs 152 differ), so filenames are derived from
// the pixel size itself and safely reused wherever sizes coincide.
export interface IosIconSpec {
  size: string; // e.g. "60x60"
  idiom: "iphone" | "ipad" | "ios-marketing";
  scale: "1x" | "2x" | "3x";
  pixels: number;
}

export const IOS_ICONS: IosIconSpec[] = [
  { size: "20x20", idiom: "iphone", scale: "2x", pixels: 40 },
  { size: "20x20", idiom: "iphone", scale: "3x", pixels: 60 },
  { size: "29x29", idiom: "iphone", scale: "2x", pixels: 58 },
  { size: "29x29", idiom: "iphone", scale: "3x", pixels: 87 },
  { size: "40x40", idiom: "iphone", scale: "2x", pixels: 80 },
  { size: "40x40", idiom: "iphone", scale: "3x", pixels: 120 },
  { size: "60x60", idiom: "iphone", scale: "2x", pixels: 120 },
  { size: "60x60", idiom: "iphone", scale: "3x", pixels: 180 },
  { size: "20x20", idiom: "ipad", scale: "1x", pixels: 20 },
  { size: "20x20", idiom: "ipad", scale: "2x", pixels: 40 },
  { size: "29x29", idiom: "ipad", scale: "1x", pixels: 29 },
  { size: "29x29", idiom: "ipad", scale: "2x", pixels: 58 },
  { size: "40x40", idiom: "ipad", scale: "1x", pixels: 40 },
  { size: "40x40", idiom: "ipad", scale: "2x", pixels: 80 },
  { size: "76x76", idiom: "ipad", scale: "1x", pixels: 76 },
  { size: "76x76", idiom: "ipad", scale: "2x", pixels: 152 },
  { size: "83.5x83.5", idiom: "ipad", scale: "2x", pixels: 167 },
  { size: "1024x1024", idiom: "ios-marketing", scale: "1x", pixels: 1024 },
];

export const iosFilename = (pixels: number) => `icon-${pixels}.png`;

// ---------- Android: legacy launcher mipmaps ----------
export interface AndroidIconSpec {
  density: string;
  pixels: number;
}

export const ANDROID_ICONS: AndroidIconSpec[] = [
  { density: "mipmap-mdpi", pixels: 48 },
  { density: "mipmap-hdpi", pixels: 72 },
  { density: "mipmap-xhdpi", pixels: 96 },
  { density: "mipmap-xxhdpi", pixels: 144 },
  { density: "mipmap-xxxhdpi", pixels: 192 },
];

export const ANDROID_PLAYSTORE_PIXELS = 512;

// ---------- Web / Favicon ----------
export const WEB_ICON_SIZES = {
  favicon16: 16,
  favicon32: 32,
  faviconIco: [16, 32, 48] as number[], // sizes packed into favicon.ico
  appleTouchIcon: 180,
  androidChromeSmall: 192,
  androidChromeLarge: 512,
};

// ---------- macOS: AppIcon.iconset ----------
export interface MacIconSpec {
  filename: string;
  pixels: number;
}

export const MACOS_ICONS: MacIconSpec[] = [
  { filename: "icon_16x16.png", pixels: 16 },
  { filename: "icon_16x16@2x.png", pixels: 32 },
  { filename: "icon_32x32.png", pixels: 32 },
  { filename: "icon_32x32@2x.png", pixels: 64 },
  { filename: "icon_128x128.png", pixels: 128 },
  { filename: "icon_128x128@2x.png", pixels: 256 },
  { filename: "icon_256x256.png", pixels: 256 },
  { filename: "icon_256x256@2x.png", pixels: 512 },
  { filename: "icon_512x512.png", pixels: 512 },
  { filename: "icon_512x512@2x.png", pixels: 1024 },
];
