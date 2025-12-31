import { toast } from "react-hot-toast";
import html2canvas from "html2canvas";

export const shareImage = async (
  element: HTMLElement | null,
  scale: number = 2
): Promise<boolean> => {
  if (!element) {
    toast.error("Nothing to share");
    return false;
  }

  const sharingToast = toast.loading("Preparing to share...");

  try {
    const canvas = await html2canvas(element, {
      scale: window.devicePixelRatio * scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 1.0);
    });

    if (!blob) {
      toast.error("Failed to generate image", { id: sharingToast });
      return false;
    }

    const file = new File([blob], "tsarr-creation.png", { type: "image/png" });
    const shareText = "Created with tsarr.in - Free Screenshot Editor ✨";
    const shareUrl = "https://tsarr.in";

    // Check if Web Share API with files is supported
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "My Creation - tsarr.in",
        text: shareText,
        url: shareUrl,
        files: [file],
      });
      toast.success("Shared successfully!", { id: sharingToast });
      return true;
    }
    
    // Fallback: share without file
    if (navigator.share) {
      await navigator.share({
        title: "My Creation - tsarr.in",
        text: shareText,
        url: shareUrl,
      });
      toast.success("Link shared!", { id: sharingToast });
      return true;
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Image copied to clipboard!", { id: sharingToast });
      return true;
    } catch {
      // Final fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tsarr-creation.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!", { id: sharingToast });
      return true;
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      toast.dismiss(sharingToast);
      return false;
    }
    console.error("Share failed:", err);
    toast.error("Share failed", { id: sharingToast });
    return false;
  }
};
