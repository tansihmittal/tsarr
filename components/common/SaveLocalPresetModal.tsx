import { useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";
import { toast } from "react-hot-toast";
import { validatePresetName, presetNameExists } from "@/utils/localPresets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="rounded-[20px] shadow-2xl border border-[#E5E7EB] dark:border-gray-700">
        {!showOverwriteConfirm ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-bold text-xl text-gray-800 dark:text-gray-200">Save as Local Preset</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Your preset will be saved locally in your browser
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label className="font-medium text-gray-600 dark:text-gray-400">Preset Name</Label>
              <Input
                value={presetName}
                onChange={(e) => {
                  setPresetName(e.target.value);
                  setError(null);
                }}
                type="text"
                placeholder="e.g., My Instagram Style"
                className={`w-full rounded-[10px] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all ${
                  error ? "border-red-400" : ""
                }`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                className="rounded-[10px] font-semibold shadow-lg shadow-[#2563EB]/20 hover:shadow-xl hover:shadow-[#2563EB]/30 transition-all"
                onClick={handleSave}
              >
                Save Preset
              </Button>
              <Button
                variant="ghost"
                className="font-medium rounded-[10px] hover:bg-[#F9FAFB] dark:hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <BsExclamationTriangle className="text-amber-600 text-xl" />
                </div>
                <DialogTitle className="font-bold text-xl text-gray-800 dark:text-gray-200">Overwrite Preset?</DialogTitle>
              </div>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                A preset named <span className="font-semibold text-[#2563EB]">&quot;{presetName.trim()}&quot;</span> already exists. Do you want to overwrite it with your current settings?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex gap-2">
              <Button
                className="rounded-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleConfirmOverwrite}
              >
                Overwrite
              </Button>
              <Button
                variant="ghost"
                className="font-medium rounded-[10px] hover:bg-[#F9FAFB] dark:hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800"
                onClick={handleCancelOverwrite}
              >
                Keep Both
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaveLocalPresetModal;
