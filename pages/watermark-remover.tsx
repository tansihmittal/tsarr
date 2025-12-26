import Head from "next/head";
import WatermarkRemoverLayout from "../components/watermark-remover/WatermarkRemoverLayout";

export default function WatermarkRemoverPage() {
  return (
    <>
      <Head>
        <title>Watermark Remover - tsarr.in</title>
        <meta
          name="description"
          content="Remove watermarks from images with intelligent inpainting technology"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <WatermarkRemoverLayout />
    </>
  );
}
