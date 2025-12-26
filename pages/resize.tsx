import dynamic from "next/dynamic";
import Head from "next/head";

const ImageResizerLayout = dynamic(
  () => import("../components/image-resizer/ImageResizerLayout"),
  { ssr: false }
);

const ResizePage = () => {
  return (
    <>
      <Head>
        <title>Image Resizer | Resize Images to Any Dimension</title>
        <meta name="description" content="Resize images to exact dimensions or by percentage. Supports all formats with quality control." />
      </Head>
      <ImageResizerLayout />
    </>
  );
};

export default ResizePage;
