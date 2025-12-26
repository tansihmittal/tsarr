import { toast } from "react-hot-toast";
import domtoimage from "dom-to-image";
import html2canvas from "html2canvas";

export const copyToClipboard = async (node: HTMLDivElement | null): Promise<boolean> => {
  if (!node) {
    return false;
  }

  // Check if Clipboard API is supported
  if (!navigator.clipboard || !navigator.clipboard.write) {
    toast.error("Clipboard not supported in this browser");
    return false;
  }

  const copyingToast = toast.loading("Copying to clipboard...");

  try {
    const scale = window.devicePixelRatio;
    
    // Temporarily hide scrollbars
    const elementsWithScroll: { el: HTMLElement; overflow: string }[] = [];
    node.querySelectorAll('*').forEach((el) => {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
            style.overflowX === 'auto' || style.overflowX === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll') {
          elementsWithScroll.push({ el, overflow: el.style.overflow });
          el.style.overflow = 'visible';
        }
      }
    });
    
    // Use html2canvas which handles blob URLs better than dom-to-image
    const canvas = await html2canvas(node, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    // Restore scrollbars
    elementsWithScroll.forEach(({ el, overflow }) => {
      el.style.overflow = overflow;
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });

    if (!blob) {
      toast.error("Failed to copy image", { id: copyingToast });
      return false;
    }

    const clipboardItem = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([clipboardItem]);
    
    toast.success("Copied to clipboard", { id: copyingToast });
    return true;
  } catch (error) {
    console.error("Copy to clipboard error:", error);
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      toast.error("Clipboard permission denied", { id: copyingToast });
    } else {
      toast.error("Failed to copy image", { id: copyingToast });
    }
    return false;
  }
};

export const downloadimagePng = (node: HTMLDivElement | null, res: number, filename?: string) => {
  let savingToast = toast.loading("Saving Image, please wait");

  if (node) {
    let scale = window.devicePixelRatio * res;
    domtoimage
      .toPng(node, {
        width: node.clientWidth * scale,
        height: node.clientHeight * scale,
        style: {
          transform: "scale(" + scale + ")",
          transformOrigin: "top left",
          width: node.offsetWidth + "px",
          height: node.offsetHeight + "px",
          overflow: "visible",
        },
        filter: (node: Node) => {
          // Hide scrollbars by filtering out elements with scrollbar classes
          if (node instanceof HTMLElement) {
            // Temporarily hide scrollbars
            const style = window.getComputedStyle(node);
            if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
              node.style.overflow = 'visible';
            }
          }
          return true;
        },
      })
      .then(function (dataUrl) {
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename ? `${filename}.png` : `tsarr.in-${new Date().toISOString()}.png`;
        a.click();
        toast.success("Image saved", { id: savingToast });
      })
      .catch(function (error) {
        console.error("PNG export error:", error);
        toast.error("Something went wrong", { id: savingToast });
      });
  }
};

export const downloadimageJpeg = (node: HTMLDivElement | null, res: number) => {
  let savingToast = toast.loading("Saving Image, please wait");

  if (node) {
    let scale = window.devicePixelRatio * res;

    domtoimage
      .toJpeg(node, {
        quality: 0.95,
        width: node.clientWidth * scale,
        height: node.clientHeight * scale,
        style: {
          transform: "scale(" + scale + ")",
          transformOrigin: "top left",
          width: node.offsetWidth + "px",
          height: node.offsetHeight + "px",
          overflow: "visible",
        },
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
              node.style.overflow = 'visible';
            }
          }
          return true;
        },
      })
      .then(function (dataUrl) {
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = `tsarr.in-${new Date().toISOString()}.jpeg`;
        a.click();
        toast.success("Image saved", { id: savingToast });
      })
      .catch(function (error) {
        console.error("JPEG export error:", error);
        toast.error("Something went wrong", { id: savingToast });
      });
  }
};

export const downloadimageSvg = (node: HTMLDivElement | null, res: number) => {
  let savingToast = toast.loading("Saving Image, please wait");

  if (node) {
    let scale = window.devicePixelRatio * res;

    domtoimage
      .toSvg(node, {
        width: node.clientWidth * scale,
        height: node.clientHeight * scale,
        style: {
          transform: "scale(" + scale + ")",
          transformOrigin: "top left",
          width: node.offsetWidth + "px",
          height: node.offsetHeight + "px",
          overflow: "visible",
        },
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
              node.style.overflow = 'visible';
            }
          }
          return true;
        },
      })
      .then(function (dataUrl) {
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = `tsarr.in-${new Date().toISOString()}.svg`;
        a.click();
        toast.success("Image saved", { id: savingToast });
      })
      .catch(function (error) {
        console.error("SVG export error:", error);
        toast.error("Something went wrong", { id: savingToast });
      });
  }
};
