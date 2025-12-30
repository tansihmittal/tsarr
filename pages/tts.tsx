import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled to avoid kokoro-js bundling issues
const TTSClient = dynamic(() => import("@/components/tts/TTSClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center editor-bg">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p className="text-gray-500">Loading Text-to-Speech...</p>
      </div>
    </div>
  ),
});

export default function TTSPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Text to Speech</title>
        <meta
          name="description"
          content="Convert text to natural speech with Kokoro 82M - High-quality TTS that runs locally in your browser"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TTSClient />
    </>
  );
}
