/**
 * Kokoro TTS - Web Worker approach with audio effects
 * Worker uses kokoro-js@1.2.1 from CDN
 * Supports 28 English voices + voice blending + audio effects + intelligent chunking
 * Optimized with parallel chunk processing for faster generation
 */

let worker: Worker | null = null;
let isReady = false;
let isInitializing = false;

type ProgressCallback = (progress: number, status: string) => void;
let progressCallback: ProgressCallback | null = null;
let resolveInit: (() => void) | null = null;
let rejectInit: ((err: Error) => void) | null = null;
let resolveGenerate: ((result: { audioBlob: Blob; audioUrl: string }) => void) | null = null;
let rejectGenerate: ((err: Error) => void) | null = null;

function handleWorkerMessage(e: MessageEvent) {
  const { status, ...data } = e.data;

  switch (status) {
    case "device":
      progressCallback?.(20, `Using ${data.device.toUpperCase()} acceleration`);
      break;

    case "ready":
      isReady = true;
      isInitializing = false;
      progressCallback?.(90, "Model ready!");
      resolveInit?.();
      resolveInit = null;
      break;

    case "complete":
      const audioBlob = new Blob([data.audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      progressCallback?.(100, "Done!");
      resolveGenerate?.({ audioBlob, audioUrl });
      resolveGenerate = null;
      break;

    case "error":
      const error = new Error(data.error);
      isInitializing = false;
      if (rejectInit) { rejectInit(error); rejectInit = null; }
      if (rejectGenerate) { rejectGenerate(error); rejectGenerate = null; }
      break;
  }
}

export function initKokoroWorker(onProgress?: ProgressCallback): Promise<void> {
  if (isReady) return Promise.resolve();
  if (isInitializing) {
    progressCallback = onProgress || null;
    return new Promise((resolve, reject) => {
      const check = setInterval(() => { if (isReady) { clearInterval(check); resolve(); } }, 100);
      setTimeout(() => { clearInterval(check); if (!isReady) reject(new Error("Timeout")); }, 180000);
    });
  }
  isInitializing = true;
  progressCallback = onProgress || null;
  return new Promise((resolve, reject) => {
    resolveInit = resolve;
    rejectInit = reject;
    onProgress?.(5, "Starting worker...");
    worker = new Worker("/workers/kokoro-worker.js", { type: "module" });
    worker.onmessage = handleWorkerMessage;
    worker.onerror = (e) => { console.error("Worker error:", e); isInitializing = false; reject(new Error(e.message || "Worker failed")); };
  });
}

export interface GenerateSpeechOptions {
  voice?: string;
  voice2?: string;      // Secondary voice for blending
  blendRatio?: number;  // 0-1, how much of voice2 to blend
  speed?: number;
  pitch?: number;       // Pitch shift in semitones (-12 to +12)
  reverb?: number;      // Reverb amount 0-1
}

/**
 * Intelligent text chunking that preserves sentence order
 * Optimized for faster processing with smaller chunks
 */
function chunkText(text: string, maxLength: number = 300): string[] {
  const chunks: string[] = [];
  
  // First split by paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  for (const paragraph of paragraphs) {
    // If paragraph is short enough, add it directly
    if (paragraph.length <= maxLength) {
      chunks.push(paragraph.trim());
      continue;
    }
    
    // Split by sentences (preserve punctuation)
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
    let currentChunk = "";
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would exceed max length
      if (currentChunk.length + trimmedSentence.length + 1 > maxLength) {
        // Save current chunk if not empty
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        
        // If single sentence is too long, split by clauses
        if (trimmedSentence.length > maxLength) {
          const clauses = trimmedSentence.split(/[,;:]\s*/);
          let clauseChunk = "";
          
          for (const clause of clauses) {
            if (clauseChunk.length + clause.length + 2 > maxLength) {
              if (clauseChunk.trim()) chunks.push(clauseChunk.trim());
              clauseChunk = clause;
            } else {
              clauseChunk += (clauseChunk ? ", " : "") + clause;
            }
          }
          if (clauseChunk.trim()) chunks.push(clauseChunk.trim());
          currentChunk = "";
        } else {
          currentChunk = trimmedSentence;
        }
      } else {
        currentChunk += (currentChunk ? " " : "") + trimmedSentence;
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }
  
  return chunks.filter(c => c.length > 0);
}

/**
 * Concatenate multiple WAV buffers into one
 */
function concatenateWavBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  if (buffers.length === 0) throw new Error("No buffers to concatenate");
  if (buffers.length === 1) return buffers[0];
  
  // Get sample rate from first buffer
  const firstView = new DataView(buffers[0]);
  const sampleRate = firstView.getUint32(24, true);
  const numChannels = firstView.getUint16(22, true);
  const bitsPerSample = firstView.getUint16(34, true);
  
  // Calculate total data size (skip 44-byte headers)
  let totalDataSize = 0;
  for (const buffer of buffers) {
    totalDataSize += buffer.byteLength - 44;
  }
  
  // Create new buffer
  const newBuffer = new ArrayBuffer(44 + totalDataSize);
  const view = new DataView(newBuffer);
  const uint8 = new Uint8Array(newBuffer);
  
  // Write WAV header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + totalDataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, totalDataSize, true);
  
  // Copy audio data from all buffers
  let offset = 44;
  for (const buffer of buffers) {
    const data = new Uint8Array(buffer, 44);
    uint8.set(data, offset);
    offset += data.length;
  }
  
  return newBuffer;
}

export async function generateSpeech(
  text: string,
  options: GenerateSpeechOptions = {},
  onProgress?: ProgressCallback
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  progressCallback = onProgress || null;
  if (!isReady) await initKokoroWorker(onProgress);
  if (!worker) throw new Error("Worker not initialized");
  
  // Chunk the text for better processing (smaller chunks = faster)
  const chunks = chunkText(text.trim());
  
  if (chunks.length === 1) {
    // Single chunk - generate and apply effects
    onProgress?.(92, "Generating speech...");
    const result = await generateSingleChunk(chunks[0], options);
    
    // Apply audio effects (pitch/reverb) if needed
    if (options.pitch || options.reverb) {
      onProgress?.(97, "Applying effects...");
      try {
        const processed = await applyAudioEffects(result.audioBlob, {
          pitch: options.pitch || 0,
          reverb: options.reverb || 0,
        });
        URL.revokeObjectURL(result.audioUrl);
        return processed;
      } catch (err) {
        console.error("Effects error:", err);
        return result; // Fall back to original if effects fail
      }
    }
    return result;
  }
  
  // Multiple chunks - process in batches for faster generation
  const audioBuffers: ArrayBuffer[] = [];
  const batchSize = 2; // Process 2 chunks at a time
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
    const chunkProgress = 50 + Math.round((i / chunks.length) * 45);
    onProgress?.(chunkProgress, `Generating ${i + 1}-${Math.min(i + batchSize, chunks.length)}/${chunks.length}...`);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(chunk => generateSingleChunk(chunk, options))
    );
    
    // Collect buffers and clean up URLs
    for (const result of batchResults) {
      const buffer = await result.audioBlob.arrayBuffer();
      audioBuffers.push(buffer);
      URL.revokeObjectURL(result.audioUrl);
    }
  }
  
  onProgress?.(97, "Combining audio...");
  
  // Concatenate all chunks
  const combinedBuffer = concatenateWavBuffers(audioBuffers);
  
  // Apply effects if needed
  let finalBlob = new Blob([combinedBuffer], { type: "audio/wav" });
  let finalUrl = URL.createObjectURL(finalBlob);
  
  if (options.pitch || options.reverb) {
    try {
      const processed = await applyAudioEffects(finalBlob, {
        pitch: options.pitch || 0,
        reverb: options.reverb || 0,
      });
      URL.revokeObjectURL(finalUrl);
      return processed;
    } catch (err) {
      // Fall back to original if effects fail
    }
  }
  
  return { audioBlob: finalBlob, audioUrl: finalUrl };
}

function generateSingleChunk(
  text: string,
  options: GenerateSpeechOptions
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      const { status, ...data } = e.data;
      if (status === "complete") {
        worker!.removeEventListener("message", handler);
        const audioBlob = new Blob([data.audioData], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        resolve({ audioBlob, audioUrl });
      } else if (status === "error") {
        worker!.removeEventListener("message", handler);
        reject(new Error(data.error));
      }
    };
    
    worker!.addEventListener("message", handler);
    worker!.postMessage({ 
      text,
      voice: options.voice || "af_heart",
      voice2: options.voice2,
      blendRatio: options.blendRatio || 0,
      speed: options.speed || 1.0,
    });
  });
}

// Apply audio effects using Web Audio API
async function applyAudioEffects(
  audioBlob: Blob,
  effects: { pitch: number; reverb: number }
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(duration * sampleRate * (effects.reverb > 0 ? 1.5 : 1)),
    sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Pitch shift using playbackRate
  if (effects.pitch !== 0) {
    source.playbackRate.value = Math.pow(2, effects.pitch / 12);
  }
  
  let lastNode: AudioNode = source;
  
  // Reverb using convolver
  if (effects.reverb > 0) {
    const convolver = offlineContext.createConvolver();
    convolver.buffer = createReverbImpulse(offlineContext, 2, effects.reverb * 3);
    
    const dryGain = offlineContext.createGain();
    const wetGain = offlineContext.createGain();
    dryGain.gain.value = 1 - effects.reverb * 0.5;
    wetGain.gain.value = effects.reverb;
    
    source.connect(dryGain);
    source.connect(convolver);
    convolver.connect(wetGain);
    
    const merger = offlineContext.createGain();
    dryGain.connect(merger);
    wetGain.connect(merger);
    lastNode = merger;
  }
  
  lastNode.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  const wavBuffer = audioBufferToWav(renderedBuffer);
  const newBlob = new Blob([wavBuffer], { type: "audio/wav" });
  const newUrl = URL.createObjectURL(newBlob);
  
  await audioContext.close();
  
  return { audioBlob: newBlob, audioUrl: newUrl };
}

function createReverbImpulse(context: OfflineAudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return arrayBuffer;
}

// Voice profiles - preset combinations of effects
export const voiceProfiles = [
  { id: "default", name: "Default", icon: "🎤", pitch: 0, reverb: 0, desc: "Original voice" },
  { id: "radio", name: "Radio", icon: "📻", pitch: 0, reverb: 0.15, desc: "Slight room ambience" },
  { id: "stadium", name: "Stadium", icon: "🏟️", pitch: 0, reverb: 0.6, desc: "Large venue echo" },
  { id: "cave", name: "Cave", icon: "🕳️", pitch: -2, reverb: 0.8, desc: "Deep cave reverb" },
  { id: "chipmunk", name: "Chipmunk", icon: "🐿️", pitch: 6, reverb: 0, desc: "High pitched" },
  { id: "deep", name: "Deep", icon: "🎸", pitch: -4, reverb: 0.1, desc: "Lower pitch" },
  { id: "robot", name: "Robot", icon: "🤖", pitch: -2, reverb: 0.3, desc: "Robotic effect" },
  { id: "telephone", name: "Telephone", icon: "📞", pitch: 1, reverb: 0.05, desc: "Phone quality" },
  { id: "megaphone", name: "Megaphone", icon: "📢", pitch: 2, reverb: 0.4, desc: "Announcement style" },
  { id: "giant", name: "Giant", icon: "🦣", pitch: -6, reverb: 0.5, desc: "Booming voice" },
  { id: "fairy", name: "Fairy", icon: "🧚", pitch: 8, reverb: 0.3, desc: "Magical high pitch" },
  { id: "narrator", name: "Narrator", icon: "📖", pitch: -1, reverb: 0.2, desc: "Storytelling voice" },
];

export function getKokoroVoices() {
  // All 28 voices supported by kokoro-js ONNX model
  return [
    // 🇺🇸 US English - Female (11)
    { id: "af_heart", name: "Heart ❤️", lang: "en-US", gender: "female", desc: "Warm, friendly, natural" },
    { id: "af_bella", name: "Bella 🔥", lang: "en-US", gender: "female", desc: "Energetic, dynamic" },
    { id: "af_nicole", name: "Nicole 🎧", lang: "en-US", gender: "female", desc: "Clear, professional" },
    { id: "af_aoede", name: "Aoede 🎵", lang: "en-US", gender: "female", desc: "Musical, expressive" },
    { id: "af_kore", name: "Kore", lang: "en-US", gender: "female", desc: "Balanced, versatile" },
    { id: "af_sarah", name: "Sarah", lang: "en-US", gender: "female", desc: "Neutral, calm" },
    { id: "af_nova", name: "Nova ⭐", lang: "en-US", gender: "female", desc: "Bright, modern" },
    { id: "af_sky", name: "Sky ☁️", lang: "en-US", gender: "female", desc: "Soft, gentle, soothing" },
    { id: "af_alloy", name: "Alloy", lang: "en-US", gender: "female", desc: "Professional, authoritative" },
    { id: "af_jessica", name: "Jessica", lang: "en-US", gender: "female", desc: "Friendly, approachable" },
    { id: "af_river", name: "River 🌊", lang: "en-US", gender: "female", desc: "Flowing, natural" },
    
    // 🇺🇸 US English - Male (9)
    { id: "am_michael", name: "Michael", lang: "en-US", gender: "male", desc: "Deep, authoritative" },
    { id: "am_fenrir", name: "Fenrir 🐺", lang: "en-US", gender: "male", desc: "Strong, bold" },
    { id: "am_puck", name: "Puck 🎭", lang: "en-US", gender: "male", desc: "Playful, versatile" },
    { id: "am_echo", name: "Echo 🔊", lang: "en-US", gender: "male", desc: "Clear, resonant" },
    { id: "am_eric", name: "Eric", lang: "en-US", gender: "male", desc: "Reliable, professional" },
    { id: "am_liam", name: "Liam", lang: "en-US", gender: "male", desc: "Modern, relatable" },
    { id: "am_onyx", name: "Onyx 💎", lang: "en-US", gender: "male", desc: "Rich, deep, elegant" },
    { id: "am_adam", name: "Adam", lang: "en-US", gender: "male", desc: "Classic, versatile" },
    { id: "am_santa", name: "Santa 🎅", lang: "en-US", gender: "male", desc: "Warm, jolly" },

    // 🇬🇧 UK English - Female (4)
    { id: "bf_emma", name: "Emma 🇬🇧", lang: "en-GB", gender: "female", desc: "Refined, elegant" },
    { id: "bf_isabella", name: "Isabella 🇬🇧", lang: "en-GB", gender: "female", desc: "Professional, articulate" },
    { id: "bf_alice", name: "Alice 📚", lang: "en-GB", gender: "female", desc: "Clear, storytelling" },
    { id: "bf_lily", name: "Lily 🌸", lang: "en-GB", gender: "female", desc: "Gentle, pleasant" },
    
    // 🇬🇧 UK English - Male (4)
    { id: "bm_george", name: "George 🇬🇧", lang: "en-GB", gender: "male", desc: "Authoritative, professional" },
    { id: "bm_fable", name: "Fable 📖", lang: "en-GB", gender: "male", desc: "Narrative, expressive" },
    { id: "bm_lewis", name: "Lewis 🇬🇧", lang: "en-GB", gender: "male", desc: "Reliable, clear" },
    { id: "bm_daniel", name: "Daniel 🇬🇧", lang: "en-GB", gender: "male", desc: "Modern, professional" },
  ];
}

export function isKokoroLoaded(): boolean { return isReady; }
export function terminateKokoro(): void { worker?.terminate(); worker = null; isReady = false; isInitializing = false; }
