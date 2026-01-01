import { useState } from "react";
import { toast } from "react-hot-toast";
import { BsTrash3Fill, BsPlus } from "react-icons/bs";
import { useLocalPresets } from "@/hooks/useLocalPresets";
import { useEditorContext } from "@/context/Editor";
import { PresetSettings, LocalPreset } from "@/interface";
import SaveLocalPresetModal from "@/components/common/SaveLocalPresetModal";
import BackgroundTile from "./BackgroundTile";

interface LocalPresetsSectionProps {
  onSavePreset?: () => void;
}

const LocalPresetsSection: React.FC<LocalPresetsSectionProps> = ({
  onSavePreset,
}) => {
  const { presets, loading, savePreset, deletePreset, applyPreset } =
    useLocalPresets();
  const { getCurrentPreset } = useEditorContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSavePreset = (name: string) => {
    if (!getCurrentPreset) {
      return { success: false, error: "Editor context not available" };
    }

    const currentSettings = getCurrentPreset();
    const settings: PresetSettings = {
      currentBackground: currentSettings.currentBackground,
      currentBackgroundType: currentSettings.currentBackgroundType,
      scale: currentSettings.scale,
      borderRadius: currentSettings.borderRadius,
      canvasRoundness: currentSettings.canvasRoundness,
      padding: currentSettings.padding,
      left: currentSettings.left,
      right: currentSettings.right,
      tilt: currentSettings.tilt,
      rotate: currentSettings.rotate,
      aspectRatio: currentSettings.aspectRatio,
      currentBoxShadow: currentSettings.currentBoxShadow,
      noise: currentSettings.noise,
      watermark: currentSettings.watermark,
      selectedFrame: currentSettings.selectedFrame,
    };

    const result = savePreset(name, settings);
    if (result.success && onSavePreset) {
      onSavePreset();
    }
    return result;
  };

  const handleDeletePreset = (id: string, name: string) => {
    const success = deletePreset(id);
    if (success) {
      toast.success(`Preset "${name}" deleted`);
    } else {
      toast.error("Failed to delete preset");
    }
  };

  const handleApplyPreset = (preset: LocalPreset) => {
    applyPreset(preset);
    toast.success(`Applied "${preset.name}"`);
  };

  const openSaveModal = () => {
    setIsModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="h-[90px] flex items-center justify-center w-full">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-primary-content text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3">
        {/* Save Current as Preset Button */}
        <button
          onClick={openSaveModal}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-primary text-primary-content font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 press-effect"
        >
          <BsPlus className="text-xl" />
          Save Current as Preset
        </button>

        {presets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presets.map((preset, index) => (
              <PresetTile
                key={preset.id}
                preset={preset}
                onApply={() => handleApplyPreset(preset)}
                onDelete={() => handleDeletePreset(preset.id, preset.name)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <SaveLocalPresetModal
        isOpen={isModalOpen}
        onClose={closeSaveModal}
        onSave={handleSavePreset}
        existingNames={presets.map((p) => p.name)}
      />
    </>
  );
};

interface PresetTileProps {
  preset: LocalPreset;
  onApply: () => void;
  onDelete: () => void;
  index?: number;
}

const PresetTile: React.FC<PresetTileProps> = ({
  preset,
  onApply,
  onDelete,
  index = 0,
}) => {
  const background = preset.settings.currentBackground.background || "white";

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-base-200/80 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 stagger-item"
      style={{ animationDelay: `${index * 0.05}s` }}
      data-testid="preset-tile"
      data-preset-name={preset.name}
    >
      <div className="h-20 relative" onClick={onApply}>
        <BackgroundTile background={background} size="100%" onTap={onApply} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3/4 h-10 rounded-lg shadow-xl bg-white/95 transition-transform duration-300 group-hover:scale-105" />
        </div>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>
      <div className="p-2 bg-base-100 flex items-center justify-between border-t border-base-200/50">
        <span
          className="text-xs font-semibold text-primary-content truncate flex-1 group-hover:text-primary transition-colors"
          data-testid="preset-name"
        >
          {preset.name}
        </span>
        <button
          className="p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete preset"
        >
          <BsTrash3Fill className="text-red-500 text-sm" />
        </button>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => {
  return (
    <div className="h-[100px] flex flex-col items-center justify-center w-full text-center p-4 rounded-xl border-2 border-dashed border-base-200">
      <span className="text-sm font-medium text-gray-500">
        No custom presets yet
      </span>
      <span className="text-xs text-gray-400 mt-1">
        Save your current settings as a preset
      </span>
    </div>
  );
};

export default LocalPresetsSection;
