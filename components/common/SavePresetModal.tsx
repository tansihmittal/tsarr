import { useEditorContext } from "@/context/Editor";
import { useAuthContext } from "@/context/User";
import { saveCloudPreset } from "@/utils/supabaseStorage";
import { useState } from "react";
import { toast } from "react-hot-toast";

const SavePresetModal: React.FC = () => {
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
      // Close modal
      const toggle = document.getElementById("my-modal-4") as HTMLInputElement | null;
      if (toggle) toggle.checked = false;
    } catch (err: any) {
      toast.error(err.message || "Couldn't save preset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input type="checkbox" id="my-modal-4" className="modal-toggle" />
      <label htmlFor="my-modal-4" className="modal cursor-pointer">
        <label className="modal-box relative rounded-md" htmlFor="">
          <h3 className="font-bold text-xl mb-4">
            What should we name your masterpiece!
          </h3>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Example: Instagram Post</span>
            </label>
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              type="text"
              placeholder="Type here"
              className="input input-bordered w-full"
            />
          </div>
          <div className="modal-action">
            <label
              htmlFor={saving ? undefined : ""}
              className="btn rounded-md font-medium"
              onClick={savePreset}
            >
              {saving ? "Saving…" : "Save your preset"}
            </label>
            <label htmlFor="my-modal-4" className="btn btn-outline font-medium rounded-md">
              Cancel
            </label>
          </div>
        </label>
      </label>
    </>
  );
};

export default SavePresetModal;
