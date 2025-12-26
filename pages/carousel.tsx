import dynamic from "next/dynamic";
import Head from "next/head";

const CarouselEditorLayout = dynamic(
  () => import("../components/carousel-editor/CarouselEditorLayout"),
  { ssr: false }
);

const CarouselEditorPage = () => {
  return (
    <>
      <Head>
        <title>Carousel Editor | Create Beautiful Slide Carousels</title>
        <meta name="description" content="Create stunning multi-slide carousels for social media with our easy-to-use editor." />
      </Head>
      <CarouselEditorLayout />
    </>
  );
};

export default CarouselEditorPage;
