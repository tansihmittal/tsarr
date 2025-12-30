/**
 * TTS Engine Utility - Runs 100% locally in browser
 * Uses Kokoro 82M neural TTS model
 */

// Re-export Kokoro functions
export { 
  generateSpeech, 
  getKokoroVoices,
  isKokoroLoaded,
  terminateKokoro
} from "./kokoroTTS";

/**
 * Check WebGPU support
 */
export async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return false;
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Detect device capabilities
 */
export async function detectDeviceCapabilities(): Promise<{
  hasWebGPU: boolean;
  cores: number;
  memory: number | null;
  connectionType: string;
}> {
  const hasWebGPU = await checkWebGPUSupport();
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 2 : 2;
  const memory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory || null : null;

  let connectionType = "unknown";
  if (typeof navigator !== "undefined") {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      connectionType = connection.effectiveType || "unknown";
    }
  }

  return {
    hasWebGPU,
    cores,
    memory,
    connectionType,
  };
}
