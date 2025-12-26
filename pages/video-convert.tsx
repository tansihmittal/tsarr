import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with FFmpeg
const VideoConverterLayout = dynamic(
  () => import("../components/video-converter/VideoConverterLayout"),
  { ssr: false }
);

export default function VideoConvertPage() {
  return (
    <>
      <Head>
        <title>Video Converter - tsarr.in</title>
        <meta name="description" content="Convert videos to MP4, WebM, AVI, MOV, MKV, GIF with custom resolution, frame rate, and quality settings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <VideoConverterLayout />
    </>
  );
}
