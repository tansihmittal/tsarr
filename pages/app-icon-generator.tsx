import dynamic from "next/dynamic";
import Head from "next/head";

const AppIconGeneratorLayout = dynamic(
  () => import("../components/app-icon-generator/AppIconGeneratorLayout"),
  { ssr: false }
);

const AppIconGeneratorPage = () => {
  return (
    <>
      <Head>
        <title>App Icon Generator | Export iOS, Android, Web & macOS Icons</title>
        <meta
          name="description"
          content="Upload one image and generate a complete app icon set for iOS, Android, Web/Favicon, and macOS as a single ZIP download. Free, no login required."
        />
      </Head>
      <AppIconGeneratorLayout />
    </>
  );
};

export default AppIconGeneratorPage;
