import Head from "next/head";
import dynamic from "next/dynamic";

const PolaroidLayout = dynamic(
  () => import("../components/polaroid/PolaroidLayout"),
  { ssr: false }
);

export default function Polaroid() {
  return (
    <>
      <Head>
        <title>Polaroid Generator - Create Vintage Polaroid Photos</title>
        <meta
          name="description"
          content="Transform your images into vintage Polaroid-style photos with customizable frames, captions, and effects."
        />
      </Head>
      <PolaroidLayout />
    </>
  );
}
