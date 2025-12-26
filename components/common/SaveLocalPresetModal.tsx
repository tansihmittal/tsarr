import { useState } from "react";
import { toast } from "react-hot-toast";
import { validatePresetName, presetNameExists } from "@/utils/localPresets";

interface SaveLocalPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => { success: boolean; error?: string };
  existingNames: string[];
}

const SaveLocalPresetModal: React.FC<SaveLocalPresetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingNames,
}) => {
  const [presetName, setPresetName] = useState("");
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setPresetName("");
    setShowOverwriteConfirm(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = () => {
    // Validate name
    const validationError = validatePresetName(presetName);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Check for duplicate name
    const nameExists = existingNames.some(
      (name) => name.toLowerCase() === presetName.trim().toLowerCase()
    );

    if (nameExists && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }

    // Perform save
    const result = onSave(presetName.trim());
    if (result.success) {
      toast.success("Preset saved successfully!");
      handleClose();
    } else {
      setError(result.error || "Failed to save preset");
      toast.error(result.error || "Failed to save preset");
    }
  };

  const handleConfirmOverwrite = () => {
    const result = onSave(presetName.trim());
    if (result.success) {
      toast.success("Preset updated successfully!");
      handleClose();
    } else {
      setError(result.error || "Failed to save preset");
      toast.error(result.error || "Failed to save preset");
    }
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <input
        type="checkbox"
        id="save-local-preset-modal"
        className="modal-toggle"
        checked={isOpen}
        readOnly
      />
      <label className="modal cursor-pointer backdrop-blur-sm bg-black/20" onClick={handleClose}>
        <label
          className="modal-box relative rounded-2xl shadow-2xl animate-fade-in-scale border border-base-200/50"
          onClick={(e) => e.stopPropagation()}
        >
          {!showOverwriteConfirm ? (
            <>
              <h3 className="font-bold text-xl mb-2 text-gray-800">Save as Local Preset</h3>
              <p className="text-sm text-gray-500 mb-4">Your preset will be saved locally in your browser</p>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-gray-600">
                    Preset Name
                  </span>
                </label>
                <input
                  value={presetName}
                  onChange={(e) => {
                    setPresetName(e.target.value);
                    setError(null);
                  }}
                  type="text"
                  placeholder="e.g., My Instagram Style"
                  className={`input input-bordered w-full rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    error ? "input-error border-red-400" : ""
                  }`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                />
                {error && (
                  <label className="label">
                    <span className="label-text-alt text-red-500 font-medium">{error}</span>
                  </label>
                )}
              </div>

              <div className="modal-action mt-6">
                <button
                  className="btn btn-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  onClick={handleSave}
                >
                  Save Preset
                </button>
                <button
                  className="btn btn-ghost font-medium rounded-xl hover:bg-base-200"
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 text-xl">⚠</span>
                </div>
                <h3 className="font-bold text-xl text-gray-800">Overwrite Preset?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                A preset named <span className="font-semibold text-primary">&quot;{presetName.trim()}&quot;</span> already exists. Do you want to overwrite it with your current settings?
              </p>

              <div className="modal-action">
                <button
                  className="btn btn-warning rounded-xl font-semibold"
                  onClick={handleConfirmOverwrite}
                >
                  Overwrite
                </button>
                <button
                  className="btn btn-ghost font-medium rounded-xl hover:bg-base-200"
                  onClick={handleCancelOverwrite}
                >
                  Keep Both
                </button>
              </div>
            </>
          )}
        </label>
      </label>
    </>
  );
};

export default SaveLocalPresetModal;
