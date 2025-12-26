import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with canvas/OCR
const ImageTextEditorLayout = dynamic(
  () => import("@/components/image-text-editor/ImageTextEditorLayout"),
  { ssr: false }
);

export default function ImageTextEditorPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Image Text Editor</title>
        <meta
          name="description"
          content="Edit any text in images - Extract, modify, and replace text in your images with AI-powered OCR"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ImageTextEditorLayout />
    </>
  );
}
