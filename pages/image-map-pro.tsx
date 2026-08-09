import Head from "next/head";
import dynamic from "next/dynamic";

const ImageMapProLayout = dynamic(
  () => import("@/components/image-map-pro/ImageMapProLayout"),
  { ssr: false }
);

export default function ImageMapProPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Image Map Pro</title>
        <meta
          name="description"
          content="Create interactive image maps with clickable hotspots. AI-powered region detection finds areas automatically."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ImageMapProLayout />
    </>
  );
}
