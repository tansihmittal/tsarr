import { useEditorContext } from "@/context/Editor";
import { gradients, solidGradients } from "@/data/gradients";
import { directionArray } from "@/data/misc";
import { BackgroundType, GradientProps } from "@/interface";
import { useState } from "react";

import BackgroundTile from "./BackgroundTile";

interface Props {
  closePicker: () => void;
}

const BackgroundPickerWidget: React.FC<Props> = ({ closePicker }) => {
  const { currentBackground, updateData, updateBackground } =
    useEditorContext();
  const [isActive, setIsActive] = useState("gradient");

  const [customGradient, setCustomGradient] = useState<GradientProps>({
    color1: currentBackground.color1,
    color2: currentBackground.color2,
    color3: currentBackground.color3,
    direction: currentBackground.direction,
    background: currentBackground.background,
  });

  const updateCurrentBackground = (bgData: GradientProps) => {
    const { id, ...data } = bgData;

    if (updateBackground && updateData) {
      updateBackground(data);

      if (data.color1 == data.color2) {
        updateData("currentBackgroundType", BackgroundType.solid);
      } else {
        updateData("currentBackgroundType", BackgroundType.gradient);
      }

      closePicker();
    }
  };

  const onCustomGradientChange = (name: string, value: string) => {
    setCustomGradient((prev) => {
      const updated = { ...prev, [name]: value };
      // Rebuild the background string with updated values
      updated.background = `linear-gradient(${updated.direction}, ${updated.color1}, ${updated.color2}${updated.color3 ? `, ${updated.color3}` : ""})`;
      return updated;
    });
  };

  // Apply gradient in real-time as colors change
  const onCustomGradientChangeRealtime = (name: string, value: string) => {
    const updated = { ...customGradient, [name]: value };
    updated.background = `linear-gradient(${updated.direction}, ${updated.color1}, ${updated.color2}${updated.color3 ? `, ${updated.color3}` : ""})`;
    setCustomGradient(updated);
    
    // Apply immediately without closing picker
    if (updateBackground && updateData) {
      updateBackground(updated);
      updateData("currentBackgroundType", BackgroundType.gradient);
    }
  };

  const applyCustomGradient = () => {
    updateCurrentBackground(customGradient);
  };

  return (
    <div className="absolute right-0 top-full py-2 px-4 bg-base-100 z-20 border-[2px] border-base-200 rounded-md max-h-[70vh] overflow-y-auto w-[380px]">
      {/* Tab selecter */}
      <div className="grid grid-cols-3 bg-base-200 rounded-md p-[0.125rem] mb-3">
        <span
          className={`cursor-pointer text-center rounded-md inline-block font-medium py-2 px-3 text-sm ${
            isActive == "gradient" && "bg-base-100"
          }`}
          onClick={() => setIsActive("gradient")}
        >
          Gradient
        </span>
        <span
          className={`cursor-pointer text-center rounded-md inline-block font-medium py-2 px-3 text-sm ${
            isActive == "solid" && "bg-base-100"
          }`}
          onClick={() => setIsActive("solid")}
        >
          Solid
        </span>
        <span
          className={`cursor-pointer text-center rounded-md inline-block font-medium py-2 px-3 text-sm ${
            isActive == "custom" && "bg-base-100"
          }`}
          onClick={() => setIsActive("custom")}
        >
          Custom
        </span>
      </div>
      
      {/* Preset gradients */}
      {isActive == "gradient" && (
        <div className="grid grid-cols-6 gap-[0.1rem]">
          {gradients.map((bg) => (
            <BackgroundTile
              key={bg.id}
              background={bg.background}
              size="52px"
              onTap={() => updateCurrentBackground(bg)}
            />
          ))}
        </div>
      )}
      
      {/* Solid colors */}
      {isActive == "solid" && (
        <div className="grid grid-cols-6 gap-[0.1rem]">
          {solidGradients.map((bg) => (
            <BackgroundTile
              key={bg.id}
              background={bg.background}
              size="52px"
              onTap={() => updateCurrentBackground(bg)}
            />
          ))}
        </div>
      )}
      
      {/* Custom gradient */}
      {isActive == "custom" && (
        <div className="flex flex-col gap-3">
          {/* Preview */}
          <div 
            className="w-full h-16 rounded-lg border-2 border-base-200"
            style={{ background: customGradient.background }}
          />
          
          {/* Color pickers in a row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">C1</span>
              <input
                value={customGradient.color1}
                type="color"
                name="color1"
                className="w-8 h-8 cursor-pointer rounded border border-base-200 p-0"
                onChange={(e) =>
                  onCustomGradientChangeRealtime(e.target.name, e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">C2</span>
              <input
                value={customGradient.color2}
                type="color"
                name="color2"
                className="w-8 h-8 cursor-pointer rounded border border-base-200 p-0"
                onChange={(e) =>
                  onCustomGradientChangeRealtime(e.target.name, e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">C3</span>
              <input
                value={customGradient.color3 || "#ffffff"}
                type="color"
                name="color3"
                className="w-8 h-8 cursor-pointer rounded border border-base-200 p-0"
                onChange={(e) =>
                  onCustomGradientChangeRealtime(e.target.name, e.target.value)
                }
              />
            </div>
          </div>
          
          {/* Direction */}
          <div className="flex gap-1 flex-wrap">
            {directionArray.map((dir) => (
              <span
                className={`h-9 w-9 p-2 border flex items-center justify-center rounded-md border-base-200 cursor-pointer hover:bg-base-200 ${
                  customGradient.direction == dir.name
                    ? "bg-base-200"
                    : "bg-base-100"
                }`}
                key={dir.id}
                onClick={() => onCustomGradientChangeRealtime("direction", dir.name)}
              >
                {dir.icon}
              </span>
            ))}
          </div>
          
          <button
            className="btn btn-sm w-full font-medium"
            onClick={() => applyCustomGradient()}
          >
            Apply & Close
          </button>
        </div>
      )}
    </div>
  );
};
export default BackgroundPickerWidget;
