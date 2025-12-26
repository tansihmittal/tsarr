import Head from "next/head";
import dynamic from "next/dynamic";

const MapMakerLayout = dynamic(
  () => import("@/components/map-maker/MapMakerLayout"),
  { ssr: false }
);

export default function MapPage() {
  return (
    <>
      <Head>
        <title>Map Maker - tsarr.in</title>
        <meta
          name="description"
          content="Create beautiful choropleth, bubble, marker, and flow maps for presentations"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MapMakerLayout />
    </>
  );
}
