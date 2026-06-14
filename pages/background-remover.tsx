import dynamic from "next/dynamic";
import Head from "next/head";

const BackgroundRemoverLayout = dynamic(
  () => import("../components/background-remover/BackgroundRemoverLayout"),
  { ssr: false }
);

const BackgroundRemoverPage = () => {
  return (
    <>
      <Head>
        <title>Background Remover | Remove Image Backgrounds Instantly</title>
        <meta
          name="description"
          content="Remove backgrounds from images instantly with AI. Free online tool, no login required, processed in your browser."
        />
      </Head>
      <BackgroundRemoverLayout />
    </>
  );
};

export default BackgroundRemoverPage;
