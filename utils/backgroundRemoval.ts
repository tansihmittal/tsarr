import { removeBackground, preload } from "@imgly/background-removal";

export interface SegmentationResult {
  foregroundUrl: string;
}

// Use highest quality model
const MODEL_CONFIG = { model: "isnet" as const };

class BackgroundRemover {
  private isProcessing = false;
  private isPreloaded = false;
  private preloadPromise: Promise<void> | null = null;

  async preloadModel(): Promise<void> {
    if (this.isPreloaded || this.preloadPromise) {
      return this.preloadPromise || Promise.resolve();
    }

    console.log("🚀 Starting AI model preload...");

    this.preloadPromise = (async () => {
      try {
        await preload(MODEL_CONFIG);
        this.isPreloaded = true;
        console.log("✅ AI model preloaded successfully!");
      } catch (error) {
        console.error("❌ Model preload failed:", error);
        this.preloadPromise = null;
      }
    })();

    return this.preloadPromise;
  }

  async processImage(
    imageUrl: string,
    onProgress?: (status: string) => void
  ): Promise<SegmentationResult> {
    if (this.isProcessing) {
      throw new Error("Already processing an image");
    }

    this.isProcessing = true;

    // Simulate progress since library callback is unreliable
    let currentProgress = 5;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    
    const startFakeProgress = () => {
      progressInterval = setInterval(() => {
        // Slow down as we approach 90%
        const increment = currentProgress < 30 ? 3 : currentProgress < 60 ? 2 : currentProgress < 85 ? 1 : 0.5;
        currentProgress = Math.min(90, currentProgress + increment);
        const phase = currentProgress < 40 ? "Loading" : "Processing";
        onProgress?.(`${phase}: ${Math.round(currentProgress)}%`);
      }, 200);
    };

    const stopFakeProgress = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    };

    try {
      onProgress?.("Loading: 5%");
      startFakeProgress();

      const resultBlob = await removeBackground(imageUrl, MODEL_CONFIG);
      
      stopFakeProgress();
      onProgress?.("Processing: 100%");
      
      const foregroundUrl = URL.createObjectURL(resultBlob);
      return { foregroundUrl };
    } catch (error) {
      stopFakeProgress();
      console.error("Background removal failed:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const backgroundRemover = new BackgroundRemover();
