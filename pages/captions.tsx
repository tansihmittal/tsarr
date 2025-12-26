import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with video/canvas
const VideoCaptionsLayout = dynamic(
  () => import("@/components/video-captions/VideoCaptionsLayout"),
  { ssr: false }
);

export default function VideoCaptionsPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Video Captions Generator</title>
        <meta
          name="description"
          content="Create beautiful video captions and subtitles - Style and export captions for your videos"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <VideoCaptionsLayout />
    </>
  );
}
