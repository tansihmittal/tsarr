import dynamic from "next/dynamic";
import Head from "next/head";

// Dynamic import to avoid SSR issues with globe.gl (uses WebGL)
const GlobeMakerLayout = dynamic(
  () => import("@/components/globe-maker/GlobeMakerLayout"),
  { ssr: false }
);

export default function GlobePage() {
  return (
    <>
      <Head>
        <title>3D Globe Maker | Create Interactive Globe Visualizations</title>
        <meta
          name="description"
          content="Create stunning 3D globe visualizations with points, arcs, and custom styling. Perfect for data visualization and presentations."
        />
      </Head>
      <GlobeMakerLayout />
    </>
  );
}
