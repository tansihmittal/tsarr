import dynamic from "next/dynamic";
import Head from "next/head";

const ImageConverterLayout = dynamic(
  () => import("../components/image-converter/ImageConverterLayout"),
  { ssr: false }
);

const ConvertPage = () => {
  return (
    <>
      <Head>
        <title>Image Format Converter | Convert Images to Any Format</title>
        <meta name="description" content="Convert images between PNG, JPG, WebP, AVIF, GIF, BMP, ICO formats with quality control." />
      </Head>
      <ImageConverterLayout />
    </>
  );
};

export default ConvertPage;
