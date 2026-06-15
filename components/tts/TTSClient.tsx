"use client";

import { useEffect, useState } from "react";
import TTSLayout from "./TTSLayout";
import { TTSContextProvider } from "@/context/TTS";

// Lazy load components to avoid any import issues
import dynamic from "next/dynamic";

const TTSMain = dynamic(() => import("./TTSMain"), { ssr: false });
const TTSControlPanel = dynamic(() => import("./TTSControlPanel"), { ssr: false });

/**
 * Client-only TTS component wrapper
 */
export default function TTSClient() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <TTSLayout>
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center text-red-500">
            <p>Error loading TTS: {error}</p>
          </div>
        </div>
        <div></div>
      </TTSLayout>
    );
  }

  if (!mounted) {
    return (
      <TTSLayout>
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#4B5563]">Loading TTS Engine...</p>
          </div>
        </div>
        <div></div>
      </TTSLayout>
    );
  }

  return (
    <TTSContextProvider>
      <TTSLayout>
        <TTSMain />
        <TTSControlPanel />
      </TTSLayout>
    </TTSContextProvider>
  );
}
