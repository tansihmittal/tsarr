import dynamic from "next/dynamic";
import Head from "next/head";

const AspectRatioLayout = dynamic(
  () => import("../components/aspect-ratio-converter/AspectRatioLayout"),
  { ssr: false }
);

const AspectRatioPage = () => {
  return (
    <>
      <Head>
        <title>Image Aspect Ratio Converter | Resize & Convert Images</title>
        <meta name="description" content="Convert images to any aspect ratio. Supports all formats, multiple resolutions (1x, 2x, 4x), and various fit modes." />
      </Head>
      <AspectRatioLayout />
    </>
  );
};

export default AspectRatioPage;
