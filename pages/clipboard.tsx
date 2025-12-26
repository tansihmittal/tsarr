import Head from "next/head";
import ClipboardSaverLayout from "../components/clipboard-saver/ClipboardSaverLayout";

export default function ClipboardPage() {
  return (
    <>
      <Head>
        <title>Clipboard to Image - tsarr.in</title>
        <meta name="description" content="Paste images from clipboard and download in any format - PNG, JPG, WebP, AVIF, GIF, BMP, ICO" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ClipboardSaverLayout />
    </>
  );
}
