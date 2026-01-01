/**
 * Kokoro TTS - Multi-threaded Web Worker Pool
 * Uses multiple workers to process sentences in parallel
 * Dynamically scales based on user's hardware
 */

const MAX_WORKERS = 4; // Max parallel workers (limited by GPU/memory)
let workers: Worker[] = [];
let workerReady: boolean[] = [];
let workerBusy: boolean[] = [];
let isInitializing = false;
let preloadStarted = false;
let activeWorkerCount = 0;

type ProgressCallback = (progress: number, status: string) => void;
let progressCallback: ProgressCallback | null = null;

/**
 * Calculate optimal worker count based on hardware
 */
function getOptimalWorkerCount(): number {
  const cpuCores = navigator.hardwareConcurrency || 4;
  // Use 1 worker per 3 cores, min 1, max 4
  // More workers = more memory usage (each loads ~200MB model)
  return Math.min(MAX_WORKERS, Math.max(1, Math.floor(cpuCores / 3)));
}

function createWorker(index: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/kokoro-worker.js", { type: "module" });
    workers[index] = worker;
    workerReady[index] = false;
    workerBusy[index] = false;
    
    const initHandler = (e: MessageEvent) => {
      const { status, ...data } = e.data;
      if (status === "device") {
        console.log(`[TTS Worker ${index}] Using ${data.device} acceleration`);
      } else if (status === "ready") {
        workerReady[index] = true;
        console.log(`[TTS Worker ${index}] Ready`);
        resolve();
      } else if (status === "error") {
        reject(new Error(data.error));
      }
    };
    
    worker.onmessage = initHandler;
    worker.onerror = (e) => reject(new Error(e.message || "Worker failed"));
  });
}

/**
 * Preload workers in the background
 */
export function preloadKokoroModel(): void {
  if (preloadStarted) return;
  preloadStarted = true;
  
  activeWorkerCount = getOptimalWorkerCount();
  console.log(`[TTS] Preloading ${activeWorkerCount} worker(s) (${navigator.hardwareConcurrency || 'unknown'} CPU cores)`);
  
  // Start loading first worker immediately
  createWorker(0).catch(err => console.error("[TTS] Preload error:", err));
}

export async function initKokoroWorker(onProgress?: ProgressCallback): Promise<void> {
  if (workers.length > 0 && workerReady.some(r => r)) return;
  if (isInitializing) {
    // Wait for initialization
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (workerReady.some(r => r)) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 180000);
    });
  }
  
  isInitializing = true;
  progressCallback = onProgress || null;
  
  activeWorkerCount = getOptimalWorkerCount();
  
  onProgress?.(5, `Starting ${activeWorkerCount} TTS worker${activeWorkerCount > 1 ? 's' : ''}...`);
  console.log(`[TTS] Initializing ${activeWorkerCount} worker(s)`);
  
  const initStart = performance.now();
  
  try {
    // Initialize all workers in parallel
    await Promise.all(
      Array.from({ length: activeWorkerCount }, (_, i) => createWorker(i))
    );
    
    console.log(`[TTS] All ${activeWorkerCount} workers ready in ${((performance.now() - initStart) / 1000).toFixed(2)}s`);
    onProgress?.(90, "All workers ready!");
  } catch (err) {
    console.error("[TTS] Worker init error:", err);
    throw err;
  } finally {
    isInitializing = false;
  }
}

export interface GenerateSpeechOptions {
  voice?: string;
  voice2?: string;
  blendRatio?: number;
  speed?: number;
  pitch?: number;
  reverb?: number;
}

/**
 * Split text into sentences for clean audio generation
 */
function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Concatenate WAV buffers with crossfade
 */
function concatenateWavWithCrossfade(buffers: ArrayBuffer[], crossfadeMs: number = 30): ArrayBuffer {
  if (buffers.length === 0) throw new Error("No buffers");
  if (buffers.length === 1) return buffers[0];
  
  const firstView = new DataView(buffers[0]);
  const sampleRate = firstView.getUint32(24, true);
  const numChannels = firstView.getUint16(22, true);
  const bitsPerSample = firstView.getUint16(34, true);
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const crossfadeSamples = Math.floor((crossfadeMs / 1000) * sampleRate);
  
  const audioDataArrays: Int16Array[] = buffers.map(buf => new Int16Array(buf.slice(44)));
  
  let totalSamples = audioDataArrays[0].length;
  for (let i = 1; i < audioDataArrays.length; i++) {
    totalSamples += audioDataArrays[i].length - crossfadeSamples;
  }
  
  const outputSamples = new Int16Array(totalSamples);
  let writePos = 0;
  
  for (let i = 0; i < audioDataArrays.length; i++) {
    const samples = audioDataArrays[i];
    
    if (i === 0) {
      for (let j = 0; j < samples.length; j++) {
        if (j >= samples.length - crossfadeSamples) {
          const fadePos = j - (samples.length - crossfadeSamples);
          const fadeOut = 1 - (fadePos / crossfadeSamples);
          outputSamples[writePos + j] = Math.round(samples[j] * fadeOut);
        } else {
          outputSamples[writePos + j] = samples[j];
        }
      }
      writePos += samples.length - crossfadeSamples;
    } else {
      for (let j = 0; j < samples.length; j++) {
        if (j < crossfadeSamples) {
          const fadeIn = j / crossfadeSamples;
          const newSample = Math.round(samples[j] * fadeIn);
          outputSamples[writePos + j] = Math.max(-32768, Math.min(32767, outputSamples[writePos + j] + newSample));
        } else if (i < audioDataArrays.length - 1 && j >= samples.length - crossfadeSamples) {
          const fadePos = j - (samples.length - crossfadeSamples);
          const fadeOut = 1 - (fadePos / crossfadeSamples);
          outputSamples[writePos + j] = Math.round(samples[j] * fadeOut);
        } else {
          outputSamples[writePos + j] = samples[j];
        }
      }
      writePos += samples.length - crossfadeSamples;
    }
  }
  
  const dataSize = outputSamples.length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);
  
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  
  const outputView = new Int16Array(wavBuffer, 44);
  outputView.set(outputSamples.slice(0, outputView.length));
  
  return wavBuffer;
}

/**
 * Generate audio for a single sentence using a specific worker
 */
function generateWithWorker(
  workerIndex: number,
  text: string,
  options: GenerateSpeechOptions
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const worker = workers[workerIndex];
    workerBusy[workerIndex] = true;
    
    const handler = (e: MessageEvent) => {
      const { status, ...data } = e.data;
      if (status === "complete") {
        worker.removeEventListener("message", handler);
        workerBusy[workerIndex] = false;
        resolve(data.audioData);
      } else if (status === "error") {
        worker.removeEventListener("message", handler);
        workerBusy[workerIndex] = false;
        reject(new Error(data.error));
      }
    };
    
    worker.addEventListener("message", handler);
    worker.postMessage({
      text,
      voice: options.voice || "af_heart",
      voice2: options.voice2,
      blendRatio: options.blendRatio || 0,
      speed: options.speed || 1.0,
    });
  });
}

/**
 * Get next available worker index
 */
function getAvailableWorker(): number {
  for (let i = 0; i < activeWorkerCount; i++) {
    if (workerReady[i] && !workerBusy[i]) return i;
  }
  return -1;
}

export async function generateSpeech(
  text: string,
  options: GenerateSpeechOptions = {},
  onProgress?: ProgressCallback
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  const totalStart = performance.now();
  const trimmedText = text.trim();
  console.log(`[TTS] Starting multi-threaded generation for ${trimmedText.length} chars`);
  
  progressCallback = onProgress || null;
  
  if (!workerReady.some(r => r)) {
    const initStart = performance.now();
    await initKokoroWorker(onProgress);
    console.log(`[TTS] ⏱️ Workers init: ${((performance.now() - initStart) / 1000).toFixed(2)}s`);
  }
  
  // For short texts, use single worker
  if (trimmedText.length <= 250) {
    onProgress?.(92, "Generating speech...");
    const genStart = performance.now();
    const buffer = await generateWithWorker(0, trimmedText, options);
    console.log(`[TTS] ⏱️ Generation: ${((performance.now() - genStart) / 1000).toFixed(2)}s`);
    
    const audioBlob = new Blob([buffer], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    if (options.pitch || options.reverb) {
      return await applyEffectsAndReturn({ audioBlob, audioUrl }, options, totalStart, onProgress);
    }
    
    console.log(`[TTS] ✅ Total time: ${((performance.now() - totalStart) / 1000).toFixed(2)}s`);
    return { audioBlob, audioUrl };
  }
  
  // Split into sentences
  const sentences = splitIntoSentences(trimmedText);
  console.log(`[TTS] Split into ${sentences.length} sentences, using ${activeWorkerCount} workers`);
  
  // Process sentences in parallel using worker pool
  const audioBuffers: ArrayBuffer[] = new Array(sentences.length);
  let completed = 0;
  
  const genStart = performance.now();
  
  await new Promise<void>((resolve, reject) => {
    let nextSentence = 0;
    
    const processNext = async () => {
      while (nextSentence < sentences.length) {
        const workerIdx = getAvailableWorker();
        if (workerIdx === -1) {
          // No available worker, wait a bit
          await new Promise(r => setTimeout(r, 50));
          continue;
        }
        
        const sentenceIdx = nextSentence++;
        const sentence = sentences[sentenceIdx];
        
        console.log(`[TTS] Worker ${workerIdx} processing sentence ${sentenceIdx + 1}/${sentences.length}`);
        
        generateWithWorker(workerIdx, sentence, options)
          .then(buffer => {
            audioBuffers[sentenceIdx] = buffer;
            completed++;
            
            const pct = 50 + Math.round((completed / sentences.length) * 45);
            onProgress?.(pct, `Generated ${completed}/${sentences.length} sentences`);
            
            if (completed === sentences.length) {
              resolve();
            }
          })
          .catch(reject);
      }
    };
    
    // Start processing with all available workers
    for (let i = 0; i < activeWorkerCount; i++) {
      processNext();
    }
  });
  
  console.log(`[TTS] ⏱️ Parallel generation: ${((performance.now() - genStart) / 1000).toFixed(2)}s`);
  
  // Concatenate in order
  onProgress?.(97, "Combining audio...");
  const concatStart = performance.now();
  const combinedBuffer = concatenateWavWithCrossfade(audioBuffers);
  console.log(`[TTS] ⏱️ Concatenation: ${(performance.now() - concatStart).toFixed(0)}ms`);
  
  const audioBlob = new Blob([combinedBuffer], { type: "audio/wav" });
  const audioUrl = URL.createObjectURL(audioBlob);
  
  if (options.pitch || options.reverb) {
    return await applyEffectsAndReturn({ audioBlob, audioUrl }, options, totalStart, onProgress);
  }
  
  console.log(`[TTS] ✅ Total time: ${((performance.now() - totalStart) / 1000).toFixed(2)}s`);
  return { audioBlob, audioUrl };
}

async function applyEffectsAndReturn(
  result: { audioBlob: Blob; audioUrl: string },
  options: GenerateSpeechOptions,
  totalStart: number,
  onProgress?: ProgressCallback
): Promise<{ audioBlob: Blob; audioUrl: string }> {
  onProgress?.(97, "Applying effects...");
  try {
    const effectStart = performance.now();
    const processed = await applyAudioEffects(result.audioBlob, {
      pitch: options.pitch || 0,
      reverb: options.reverb || 0,
    });
    console.log(`[TTS] ⏱️ Effects: ${((performance.now() - effectStart) / 1000).toFixed(2)}s`);
    URL.revokeObjectURL(result.audioUrl);
    console.log(`[TTS] ✅ Total time: ${((performance.now() - totalStart) / 1000).toFixed(2)}s`);
    return processed;
  } catch (err) {
    console.error("Effects error:", err);
    console.log(`[TTS] ✅ Total time: ${((performance.now() - totalStart) / 1000).toFixed(2)}s`);
    return result;
  }
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

export function isKokoroLoaded(): boolean { return workerReady.some(r => r); }
export function terminateKokoro(): void { 
  workers.forEach(w => w?.terminate()); 
  workers = []; 
  workerReady = []; 
  workerBusy = [];
  preloadStarted = false;
}
