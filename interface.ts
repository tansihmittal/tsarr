export interface GradientProps {
  id?: number;
  direction: string;
  background: string;
  color1: string;
  color2: string;
  color3?: string;
}

export enum BackgroundType {
  "gradient",
  "solid",
  "custom",
}

export interface EditorProps {
  resetChanges?: () => void;
  updateBackground?: (value: GradientProps) => void;
  updateData?: (name: string, value: any) => void;
  getCurrentPreset?: () => EditorProps;
  updatePreset?: (data: PresetProps) => void;
  currentBackground: GradientProps;
  currentBackgroundType: BackgroundType;
  selectedImage: string | null;
  imageDimensions: { width: number; height: number };
  scale: number;
  borderRadius: number;
  canvasRoundness: number;
  padding: number;
  left: number;
  right: number;
  tilt: {
    name: string;
    value: string;
  };
  rotate: number;
  aspectRatio: {
    name: string;
    value: string;
  };
  currentBoxShadow: {
    name: string;
    value: string;
  };
  noise: boolean;
  watermark: {
    visible: boolean;
    value: string;
  };
  selectedFrame: {
    name: string;
    value: string;
  };
  frameTitle: string;
  frameUrl: string;
  showAnnotations: boolean;
  annotationElements: any[];
  drawingTool: string;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  sloppiness: number;
  selectedElementId: string | null;
}

export interface PresetProps {
  presetName: string;
  currentBackground: GradientProps;
  currentBackgroundType: BackgroundType;
  scale: number;
  borderRadius: number;
  canvasRoundness: number;
  padding: number;
  left: number;
  right: number;
  tilt: {
    name: string;
    value: string;
  };
  rotate: number;
  aspectRatio: {
    name: string;
    value: string;
  };
  currentBoxShadow: {
    name: string;
    value: string;
  };
  noise: boolean;
  watermark: {
    visible: boolean;
    value: string;
  };
  selectedFrame: {
    name: string;
    value: string;
  };
}

export interface UserDetails {
  displayName: string | null | undefined;
  email: string | null | undefined;
  photoUrl: string | null | undefined;
  uid: string | null | undefined;
}

export interface UserAuthProps {
  currentUser: UserDetails | null;
  loginWithGoogle: () => void;
  logout: () => void;
}

/**
 * PresetSettings captures all saveable editor settings for a local preset.
 * This type is used for serialization to localStorage.
 */
export interface PresetSettings {
  currentBackground: GradientProps;
  currentBackgroundType: BackgroundType;
  scale: number;
  borderRadius: number;
  canvasRoundness: number;
  padding: number;
  left: number;
  right: number;
  tilt: {
    name: string;
    value: string;
  };
  rotate: number;
  aspectRatio: {
    name: string;
    value: string;
  };
  currentBoxShadow: {
    name: string;
    value: string;
  };
  noise: boolean;
  watermark: {
    visible: boolean;
    value: string;
  };
  selectedFrame: {
    name: string;
    value: string;
  };
}

/**
 * LocalPreset represents a user-created preset stored in localStorage.
 */
export interface LocalPreset {
  id: string;
  name: string;
  createdAt: number;
  settings: PresetSettings;
}
