import dynamic from "next/dynamic";
import Head from "next/head";

const ColorPaletteLayout = dynamic(
  () => import("../components/color-palette/ColorPaletteLayout"),
  { ssr: false }
);

const ColorPalettePage = () => {
  return (
    <>
      <Head>
        <title>Color Palette Extractor | Extract Colors from Any Image</title>
        <meta
          name="description"
          content="Extract dominant color palettes from any image using AI-powered k-means clustering. Copy hex codes, export palettes. Free, no login required."
        />
      </Head>
      <ColorPaletteLayout />
    </>
  );
};

export default ColorPalettePage;
