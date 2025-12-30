// Kokoro TTS Web Worker - v1.2.1 with audio effects
import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

let tts = null;
let currentDevice = "wasm";

// Device detection
async function detectWebGPU() {
  try {
    const adapter = await navigator.gpu?.requestAdapter();
    return !!adapter;
  } catch (e) {
    return false;
  }
}

// Initialize
(async () => {
  try {
    currentDevice = (await detectWebGPU()) ? "webgpu" : "wasm";
    self.postMessage({ status: "device", device: currentDevice });

    // Use correct model ID from docs
    const model_id = "onnx-community/Kokoro-82M-ONNX";
    tts = await KokoroTTS.from_pretrained(model_id, {
      dtype: "q8",
    });

    // Get available voices from the model
    const voices = tts.list_voices?.() || [];
    self.postMessage({ status: "ready", voices, device: currentDevice });
  } catch (e) {
    self.postMessage({ status: "error", error: e.message });
  }
})();

// Listen for messages
self.addEventListener("message", async (e) => {
  const { text, voice, voice2, blendRatio, speed } = e.data;

  if (!tts) {
    self.postMessage({ status: "error", error: "Model not loaded" });
    return;
  }

  try {
    // Generate speech using the API from docs
    const audio = await tts.generate(text, { voice: voice || "af_sky", speed: speed || 1.0 });
    
    // The audio object should have a toBlob() or similar method
    let wavBuffer;
    
    if (typeof audio.toBlob === 'function') {
      const blob = await audio.toBlob();
      wavBuffer = await blob.arrayBuffer();
    } else if (typeof audio.toWav === 'function') {
      wavBuffer = audio.toWav();
    } else if (audio.audio instanceof Float32Array) {
      // Manual WAV encoding if we only have raw samples
      wavBuffer = float32ToWav(audio.audio, audio.sampling_rate || 24000);
    } else {
      throw new Error("Cannot extract audio data from result");
    }

    // If voice blending is requested, generate second voice and blend
    if (voice2 && blendRatio > 0 && blendRatio < 1) {
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
    }
    
    self.postMessage({ status: "complete", audioData: wavBuffer }, [wavBuffer]);
  } catch (e) {
    console.error("TTS error:", e);
    self.postMessage({ status: "error", error: e.message || "Generation failed" });
  }
});

// Blend two WAV buffers with linear interpolation
function blendWavBuffers(buffer1, buffer2, ratio) {
  const view1 = new DataView(buffer1);
  const view2 = new DataView(buffer2);
  
  // Get sample data (skip 44-byte WAV header)
  const samples1 = new Int16Array(buffer1.slice(44));
  const samples2 = new Int16Array(buffer2.slice(44));
  
  // Use the shorter length
  const length = Math.min(samples1.length, samples2.length);
  const blended = new Int16Array(length);
  
  for (let i = 0; i < length; i++) {
    blended[i] = Math.round(samples1[i] * (1 - ratio) + samples2[i] * ratio);
  }
  
  // Create new WAV buffer
  const sampleRate = view1.getUint32(24, true);
  return int16ToWav(blended, sampleRate);
}

// Encode Int16Array to WAV format
function int16ToWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }
  
  return buffer;
}

// Encode Float32Array to WAV format
function float32ToWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * (s < 0 ? 32768 : 32767), true);
  }
  
  return buffer;
}
