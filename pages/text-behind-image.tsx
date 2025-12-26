import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const TextBehindImageLayout = dynamic(
  () => import("@/components/text-behind-image/TextBehindImageLayout"),
  { ssr: false }
);

export default function TextBehindImagePage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Text Behind Image Editor</title>
        <meta
          name="description"
          content="Create stunning text behind image effects - Place text behind objects in your images"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TextBehindImageLayout />
    </>
  );
}