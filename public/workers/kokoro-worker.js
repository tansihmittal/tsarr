// Kokoro TTS Web Worker - v1.2.1 optimized for speed
import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

let tts = null;
let currentDevice = "wasm";
let isLoading = false;

// Device detection - prefer WebGPU for speed
async function detectBestDevice() {
  try {
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (adapter) {
        console.log("[Worker] WebGPU available");
        return "webgpu";
      }
    }
  } catch (e) {
    console.log("[Worker] WebGPU not available:", e.message);
  }
  return "wasm";
}

// Initialize model
async function initModel() {
  if (tts || isLoading) return;
  isLoading = true;
  
  const initStart = performance.now();
  
  try {
    currentDevice = await detectBestDevice();
    self.postMessage({ status: "device", device: currentDevice });
    
    console.log("[Worker] Loading Kokoro model with", currentDevice);
    const model_id = "onnx-community/Kokoro-82M-ONNX";
    
    // fp32 for best quality, webgpu for speed
    tts = await KokoroTTS.from_pretrained(model_id, {
      dtype: "fp32",
      device: currentDevice,
    });
    
    const initTime = performance.now() - initStart;
    console.log(`[Worker] Model loaded in ${(initTime / 1000).toFixed(2)}s`);
    
    const voices = tts.list_voices?.() || [];
    self.postMessage({ status: "ready", voices, device: currentDevice });
  } catch (e) {
    console.error("[Worker] Init error:", e);
    self.postMessage({ status: "error", error: e.message });
  } finally {
    isLoading = false;
  }
}

// Start loading immediately
initModel();

// Listen for messages
self.addEventListener("message", async (e) => {
  const { type, text, voice, voice2, blendRatio, speed } = e.data;
  
  // Handle preload request
  if (type === "preload") {
    if (!tts && !isLoading) await initModel();
    return;
  }

  if (!tts) {
    // Wait for model to load
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (tts) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 60000);
    });
    
    if (!tts) {
      self.postMessage({ status: "error", error: "Model not loaded" });
      return;
    }
  }

  try {
    const genStart = performance.now();
    console.log(`[Worker] Generating ${text.length} chars with voice: ${voice}`);
    
    // Generate speech
    const audio = await tts.generate(text, { 
      voice: voice || "af_heart", 
      speed: speed || 1.0 
    });
    
    const genTime = performance.now() - genStart;
    console.log(`[Worker] ⏱️ Generation: ${(genTime / 1000).toFixed(2)}s for ${text.length} chars`);
    console.log(`[Worker] ⏱️ Speed: ${(text.length / (genTime / 1000)).toFixed(0)} chars/sec`);
    
    // Extract WAV buffer
    const extractStart = performance.now();
    let wavBuffer;
    if (typeof audio.toBlob === 'function') {
      const blob = await audio.toBlob();
      wavBuffer = await blob.arrayBuffer();
    } else if (typeof audio.toWav === 'function') {
      wavBuffer = audio.toWav();
    } else if (audio.audio instanceof Float32Array) {
      wavBuffer = float32ToWav(audio.audio, audio.sampling_rate || 24000);
    } else {
      throw new Error("Cannot extract audio data");
    }
    
    const extractTime = performance.now() - extractStart;
    console.log(`[Worker] ⏱️ Audio extraction: ${extractTime.toFixed(0)}ms`);

    // Voice blending if requested
    if (voice2 && blendRatio > 0 && blendRatio < 1) {
      const blendStart = performance.now();
      const audio2 = await tts.generate(text, { voice: voice2, speed: speed || 1.0 });
      let wavBuffer2;
      
      if (typeof audio2.toBlob === 'function') {
        const blob2 = await audio2.toBlob();
        wavBuffer2 = await blob2.arrayBuffer();
      } else if (audio2.audio instanceof Float32Array) {
        wavBuffer2 = float32ToWav(audio2.audio, audio2.sampling_rate || 24000);
      }
      
      if (wavBuffer2) {
        wavBuffer = blendWavBuffers(wavBuffer, wavBuffer2, blendRatio);
      }
      console.log(`[Worker] ⏱️ Voice blending: ${(performance.now() - blendStart).toFixed(0)}ms`);
    }
    
    const totalTime = performance.now() - genStart;
    console.log(`[Worker] ✅ Total time: ${(totalTime / 1000).toFixed(2)}s`);
    
    self.postMessage({ status: "complete", audioData: wavBuffer }, [wavBuffer]);
  } catch (e) {
    console.error("[Worker] TTS error:", e);
    self.postMessage({ status: "error", error: e.message || "Generation failed" });
  }
});

// Blend two WAV buffers
function blendWavBuffers(buffer1, buffer2, ratio) {
  const view1 = new DataView(buffer1);
  const samples1 = new Int16Array(buffer1.slice(44));
  const samples2 = new Int16Array(buffer2.slice(44));
  const length = Math.min(samples1.length, samples2.length);
  const blended = new Int16Array(length);
  
  for (let i = 0; i < length; i++) {
    blended[i] = Math.round(samples1[i] * (1 - ratio) + samples2[i] * ratio);
  }
  
  const sampleRate = view1.getUint32(24, true);
  return int16ToWav(blended, sampleRate);
}

// Int16 to WAV
function int16ToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }
  return buffer;
}

// Float32 to WAV
function float32ToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * (s < 0 ? 32768 : 32767), true);
  }
  return buffer;
}
