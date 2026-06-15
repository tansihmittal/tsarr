import { useAuthContext } from "@/context/User";
import { getCloudPresets, deleteCloudPreset, CloudPreset } from "@/utils/supabaseStorage";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import BackgroundTile from "./BackgroundTile";
import { useEditorContext } from "@/context/Editor";
import { PresetProps } from "@/interface";
import { BsTrash3Fill, BsPerson } from "react-icons/bs";
import { Button } from "@/components/ui/button";

const Presets: React.FC = () => {
  const [presetsData, setPresetsData] = useState<CloudPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, openAuthModal } = useAuthContext();
  const { updatePreset } = useEditorContext();
  const isMounted = useRef(true);

  const fetchPresets = useCallback(async () => {
    if (!currentUser) {
      if (isMounted.current) setLoading(false);
      return;
    }
    try {
      const data = await getCloudPresets();
      if (isMounted.current) setPresetsData(data);
    } catch {
      toast.error("Couldn't load your presets");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isMounted.current) fetchPresets();
    return () => {
      isMounted.current = false;
    };
  }, [fetchPresets]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCloudPreset(id);
      toast.success("Deleted");
      setPresetsData((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Couldn't delete preset");
    }
  };

  const LoadingBlock = ({ title }: { title: string }) => (
    <div className="h-[90px] flex items-center justify-center w-full">
      <span className="text-[#0A0A0A] capitalize">{title}</span>
    </div>
  );

  const PresetBlock = ({ title, children }: { title: string; children?: ReactNode }) => (
    <div>
      <div className="h-[90px] relative cursor-pointer">{children}</div>
      <div className="flex items-center justify-center w-full">
        <span className="bg-white px-4 py-2 text-[#0A0A0A] rounded-md capitalize text-center">
          {title}
        </span>
      </div>
    </div>
  );

  if (loading) return <LoadingBlock title="Loading" />;

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 text-center">
        <BsPerson className="text-3xl text-[#4B5563]/60" />
        <p className="text-sm text-[#4B5563]">Sign in to save and load cloud presets</p>
        <Button size="sm" onClick={openAuthModal}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <>
      {presetsData.length > 0 ? (
        <div className="grid sm:grid-cols-2 w-full p-2 gap-2">
          {presetsData.map((preset) => {
            const data = preset.data as PresetProps;
            return (
              <PresetBlock key={preset.id} title={preset.preset_name}>
                <>
                  <BackgroundTile
                    onTap={() => updatePreset && updatePreset(data)}
                    background={data.currentBackground?.background || "white"}
                    size="100%"
                  />
                  <button
                    className="absolute bottom-2 right-2 bg-white p-2 rounded-md hover:scale-110 transition-transform"
                    onClick={() => handleDelete(preset.id)}
                  >
                    <BsTrash3Fill className="text-red-500 text-lg" />
                  </button>
                </>
              </PresetBlock>
            );
          })}
        </div>
      ) : (
        <LoadingBlock title="No presets found" />
      )}
    </>
  );
};

export default Presets;
