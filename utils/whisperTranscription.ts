// Browser-based Whisper transcription using Transformers.js
// Uses chunked processing to keep UI responsive

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
}

type ProgressCallback = (status: string, progress?: number) => void;

class WhisperTranscriber {
  private transcriber: any = null;
  private isLoading = false;
  private isProcessing = false;

  async loadModel(onProgress?: ProgressCallback): Promise<void> {
    if (this.transcriber) return;
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return;
    }

    this.isLoading = true;
    onProgress?.("Loading AI model...", 5);

    try {
      // Dynamic import to avoid SSR issues
      const { pipeline, env } = await import("@xenova/transformers");

      env.allowLocalModels = false;
      env.useBrowserCache = true;

      // Yield to UI between heavy operations
      await this.yieldToUI();

      this.transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
        {
          progress_callback: (progress: any) => {
            if (progress.status === "downloading") {
              const pct = progress.progress ? Math.round(progress.progress * 0.8) : 0;
              onProgress?.(`Downloading: ${progress.file || "model"}`, pct);
            } else if (progress.status === "loading") {
              onProgress?.("Loading model...", 85);
            }
          },
        }
      );

      onProgress?.("Model ready!", 100);
    } catch (error) {
      this.isLoading = false;
      throw error;
    }

    this.isLoading = false;
  }

  // Yield control back to the UI to prevent freezing
  private yieldToUI(): Promise<void> {
    return new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => resolve(), { timeout: 100 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  async extractAudioFromVideo(
    videoElement: HTMLVideoElement,
    onProgress?: ProgressCallback
  ): Promise<{ audioData: Float32Array; sampleRate: number }> {
    onProgress?.("Extracting audio...", 0);

    const audioContext = new AudioContext();
    const videoSrc = videoElement.src;

    const response = await fetch(videoSrc);
    const arrayBuffer = await response.arrayBuffer();

    await this.yieldToUI();
    onProgress?.("Decoding audio...", 5);

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    await this.yieldToUI();

    // Get mono audio
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);

    // Process in chunks to avoid blocking
    const chunkSize = 100000;
    for (let start = 0; start < length; start += chunkSize) {
      const end = Math.min(start + chunkSize, length);
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = start; i < end; i++) {
          mono[i] += channelData[i] / numChannels;
        }
      }
      // Yield every chunk
      if (start % (chunkSize * 5) === 0) {
        await this.yieldToUI();
      }
    }

    await audioContext.close();

    return {
      audioData: mono,
      sampleRate: audioBuffer.sampleRate,
    };
  }

  private resampleAudio(
    audioData: Float32Array,
    fromRate: number,
    toRate: number
  ): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
      const t = srcIndex - srcIndexFloor;
      result[i] =
        audioData[srcIndexFloor] * (1 - t) + audioData[srcIndexCeil] * t;
    }

    return result;
  }

  async transcribeVideo(
    videoElement: HTMLVideoElement,
    wordsPerCaption: number = 2,
    onProgress?: ProgressCallback
  ): Promise<TranscriptionResult> {
    if (this.isProcessing) {
      throw new Error("Already processing");
    }

    this.isProcessing = true;

    try {
      // Extract audio
      const { audioData, sampleRate } = await this.extractAudioFromVideo(
        videoElement,
        onProgress
      );

      await this.yieldToUI();

      // Load model if needed
      await this.loadModel(onProgress);

      await this.yieldToUI();
      onProgress?.("Processing audio...", 10);

      // Resample to 16kHz if needed
      let processedAudio = audioData;
      if (sampleRate !== 16000) {
        processedAudio = this.resampleAudio(audioData, sampleRate, 16000);
      }

      await this.yieldToUI();
      onProgress?.("Generating subtitles...", 25);

      // Run transcription with error handling for worker issues
      let result;
      try {
        result = await this.transcriber(processedAudio, {
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: "word",
          task: "transcribe",
        });
      } catch (transcriptionError: any) {
        console.error("Transcription error:", transcriptionError);
        // If worker fails, try without word timestamps
        result = await this.transcriber(processedAudio, {
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: true,
          task: "transcribe",
        });
      }

      await this.yieldToUI();
      onProgress?.("Processing results...", 90);

      // Parse results into segments based on wordsPerCaption setting
      // Auto mode (0) uses smart grouping based on speech rhythm and pauses
      const segments: TranscriptionSegment[] = [];
      const isAutoMode = wordsPerCaption === 0;
      const targetWords = isAutoMode ? 3 : wordsPerCaption; // Default to 3 for auto

      if (result.chunks && Array.isArray(result.chunks)) {
        const words = result.chunks.filter(
          (chunk: any) => chunk && typeof chunk.text === 'string' && chunk.text.trim() && chunk.timestamp && chunk.timestamp[0] !== null
        );

        let currentPhrase: string[] = [];
        let phraseStart: number | null = null;
        let phraseEnd: number = 0;
        let lastWordEnd: number = 0;

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const wordText = typeof word.text === 'string' ? word.text.trim() : '';
          
          // Use exact timestamps from Whisper
          const wordStart = typeof word.timestamp[0] === 'number' ? word.timestamp[0] : 0;
          const wordEnd = typeof word.timestamp[1] === 'number' ? word.timestamp[1] : wordStart + 0.3;

          // Skip empty words
          if (!wordText) continue;

          // Auto mode: detect natural pauses (gap > 0.3s between words)
          const hasNaturalPause = isAutoMode && lastWordEnd > 0 && (wordStart - lastWordEnd) > 0.3;
          
          // If there's a natural pause and we have words, create a segment
          if (hasNaturalPause && currentPhrase.length > 0 && phraseStart !== null) {
            const phraseText = currentPhrase.join(" ").trim();
            if (phraseText.length > 0) {
              const duration = phraseEnd - phraseStart;
              const adjustedEnd = duration < 0.2 ? phraseStart + 0.2 : phraseEnd;
              segments.push({
                text: phraseText,
                start: Math.round(phraseStart * 100) / 100,
                end: Math.round(adjustedEnd * 100) / 100,
              });
            }
            currentPhrase = [];
            phraseStart = null;
          }

          if (phraseStart === null) {
            phraseStart = wordStart;
          }

          currentPhrase.push(wordText);
          phraseEnd = wordEnd;
          lastWordEnd = wordEnd;

          // Create caption based on wordsPerCaption setting
          const isPunctuation = /[.!?,;:]$/.test(wordText);
          const isAtWordLimit = currentPhrase.length >= targetWords;
          const isLastWord = i === words.length - 1;
          
          // Auto mode: also break on longer words or emphasis words
          const isLongWord = isAutoMode && wordText.length > 8;
          const isEmphasisWord = isAutoMode && /^[A-Z]{2,}$/.test(wordText); // ALL CAPS words

          if (isAtWordLimit || (isPunctuation && currentPhrase.length >= 1) || isLastWord || isLongWord || isEmphasisWord) {
            if (currentPhrase.length > 0 && phraseStart !== null) {
              const phraseText = currentPhrase.join(" ").trim();
              
              // Skip empty or whitespace-only captions (silent parts)
              if (phraseText.length > 0) {
                // Ensure minimum duration of 0.2s for readability
                const duration = phraseEnd - phraseStart;
                const adjustedEnd = duration < 0.2 ? phraseStart + 0.2 : phraseEnd;
                
                segments.push({
                  text: phraseText,
                  start: Math.round(phraseStart * 100) / 100, // Round to 2 decimal places
                  end: Math.round(adjustedEnd * 100) / 100,
                });
              }
            }
            currentPhrase = [];
            phraseStart = null;
          }
        }
      }

      onProgress?.("Complete!", 100);

      return {
        text: result.text || "",
        segments,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async preloadModel(): Promise<void> {
    try {
      await this.loadModel();
    } catch (e) {
      console.warn("Failed to preload model:", e);
    }
  }
}

export const whisperTranscriber = new WhisperTranscriber();
export type { TranscriptionResult, TranscriptionSegment };
