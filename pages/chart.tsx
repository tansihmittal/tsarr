import Head from "next/head";
import dynamic from "next/dynamic";

const ChartMakerLayout = dynamic(
  () => import("../components/chart-maker/ChartMakerLayout"),
  { ssr: false }
);

export default function ChartPage() {
  return (
    <>
      <Head>
        <title>Chart Maker - tsarr.in</title>
        <meta name="description" content="Create beautiful charts and graphs - Bar, Line, Pie, Doughnut, Radar, Polar Area" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChartMakerLayout />
    </>
  );
}
