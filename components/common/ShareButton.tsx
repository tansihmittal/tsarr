import { useState } from "react";
import { BsShare, BsCheck2 } from "react-icons/bs";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  getImageBlob: () => Promise<Blob | null>;
  title?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  getImageBlob,
  title = "Share",
  className = ""
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);

    try {
      const blob = await getImageBlob();
      if (!blob) {
        toast.error("Failed to generate image");
        setIsSharing(false);
        return;
      }

      const file = new File([blob], "tsarr-creation.png", { type: "image/png" });
      const shareText = "Created with tsarr.in - Free Screenshot Editor";
      const shareUrl = "https://tsarr.in";

      // Check if Web Share API is available with files support
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Creation - tsarr.in",
          text: shareText,
          url: shareUrl,
          files: [file]
        });
        toast.success("Shared successfully!");
      } else if (navigator.share) {
        // Fallback: share without file
        await navigator.share({
          title: "My Creation - tsarr.in",
          text: shareText,
          url: shareUrl
        });
        toast.success("Link shared! Download image separately.");
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        toast.success("Image copied to clipboard!");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        toast.error("Share failed. Try downloading instead.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-[10px] font-medium transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 ${className}`}
    >
      {isSharing ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Sharing...</span>
        </>
      ) : (
        <>
          <BsShare className="text-lg" />
          <span>{title}</span>
        </>
      )}
    </Button>
  );
};

export default ShareButton;
