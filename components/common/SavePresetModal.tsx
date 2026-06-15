import { useEditorContext } from "@/context/Editor";
import { useAuthContext } from "@/context/User";
import { saveCloudPreset } from "@/utils/supabaseStorage";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SavePresetModal: React.FC<Props> = ({ open, onClose }) => {
  const { currentUser, openAuthModal } = useAuthContext();
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);
  const { getCurrentPreset } = useEditorContext();

  const savePreset = async () => {
    if (!currentUser) {
      toast.error("Sign in to save presets to the cloud");
      openAuthModal();
      return;
    }

    if (!presetName.trim()) {
      toast.error("Name can't be empty!");
      return;
    }

    // @ts-ignore
    const { selectedImage, ...settings } = getCurrentPreset();
    setSaving(true);
    try {
      await saveCloudPreset(presetName.trim(), settings);
      toast.success("Preset saved!");
      setPresetName("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Couldn't save preset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <DialogHeader>
          <DialogTitle>Save preset</DialogTitle>
          <DialogDescription>Give your preset a name to find it later.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 space-y-2">
          <Label htmlFor="preset-name">Preset name</Label>
          <Input
            id="preset-name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g. Instagram Post"
            onKeyDown={(e) => e.key === "Enter" && savePreset()}
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={savePreset} disabled={saving}>
            {saving ? "Saving…" : "Save preset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SavePresetModal;
