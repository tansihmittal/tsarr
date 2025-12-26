import { useEditorContext } from "@/context/Editor";
import { ReactNode, Ref } from "react";

interface Props {
  children: ReactNode;
  imageRef: Ref<HTMLDivElement> | null;
}

const EditorWrapper: React.FC<Props> = ({ children, imageRef }) => {
  const {
    currentBackground: { background },
    selectedImage,
    canvasRoundness,
    aspectRatio,
    padding,
  } = useEditorContext();

  // Determine if background is a gradient/url or solid color
  const isGradientOrImage = background?.startsWith('linear-gradient') || 
                            background?.startsWith('radial-gradient') || 
                            background?.startsWith('url(');

  return (
    <div
      ref={imageRef}
      style={{
        ...(isGradientOrImage 
          ? { backgroundImage: background } 
          : { backgroundColor: background }),
        backgroundSize: "cover",
        padding: `${selectedImage ? padding + "px" : "16px"}`,
        aspectRatio: `${aspectRatio.value}`,
        borderRadius: `${canvasRoundness}px`,
      }}
      className={`
        flex justify-center items-center relative overflow-hidden
        bg-cover bg-center
        transition-all duration-300 ease-out
        ${selectedImage ? "h-fit shadow-2xl shadow-black/10" : "h-full border-2 border-dashed border-gray-300"}
        ${selectedImage ? "w-fit" : "w-full"}
        max-h-[calc(100vh-150px)]
        `}
    >
      {children}
    </div>
  );
};
export default EditorWrapper;
