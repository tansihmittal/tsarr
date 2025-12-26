import {
  BackgroundType,
  EditorProps,
  GradientProps,
  PresetProps,
} from "@/interface";
import React, { createContext, useState, useContext, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const defaultValue = {
  currentBackgroundType: BackgroundType.solid,
  selectedImage: null,
  imageDimensions: { width: 0, height: 0 },
  currentBackground: {
    color1: "#667eea",
    color2: "#f0eff5",
    direction: "135deg",
    background: "#667eea",
  },
  scale: 1,
  borderRadius: 5,
  canvasRoundness: 0,
  padding: 64,
  left: 0,
  right: 0,
  rotate: 0,
  tilt: {
    name: "to center",
    value: "rotate(0)",
  },
  aspectRatio: {
    name: "Auto",
    value: "auto",
  },
  currentBoxShadow: {
    name: "None",
    value: "none",
  },
  noise: true,
  watermark: {
    visible: false,
    value: "👏 your watermark",
  },
  selectedFrame: {
    name: "None",
    value: "none",
  },
  frameTitle: "Click Here to Edit",
  frameUrl: "Click Here to Edit",
  showAnnotations: false,
  annotationElements: [],
  drawingTool: "pen",
  strokeColor: "#e03131",
  strokeWidth: 2,
  fillColor: "transparent",
  opacity: 100,
  strokeStyle: "solid" as const,
  sloppiness: 0,
  selectedElementId: null,
};

const EditorContext = createContext<EditorProps>(defaultValue);

const EditorContextProvider: React.FC<Props> = ({ children }) => {
  const [data, setData] = useState<EditorProps>(defaultValue);

  const updateBackground = (value: GradientProps) => {
    setData((prev) => ({ ...prev, currentBackground: value }));
  };

  const resetChanges = () => {
    setData(defaultValue);
  };

  const updateData = (name: string, value: any) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentPreset = () => {
    return data;
  };

  const updatePreset = (presetData: PresetProps) => {
    setData((prev) => ({
      ...prev,
      ...presetData,
    }));
  };

  return (
    <EditorContext.Provider
      value={{
        ...data,
        updateData,
        updatePreset,
        updateBackground,
        resetChanges,
        getCurrentPreset,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

// Here we create a custom hook that allows us to consume
// the todo context
function useEditorContext() {
  return useContext(EditorContext);
}

export { EditorContextProvider, useEditorContext };
