import Head from "next/head";
import BubbleBlasterLayout from "../components/bubble-blaster/BubbleBlasterLayout";

export default function BubbleBlaster() {
  return (
    <>
      <Head>
        <title>Bubble Blaster - Remove Text from Manga Speech Bubbles</title>
        <meta
          name="description"
          content="Remove text from manga and comic speech bubbles instantly. Clean bubbles for translation or editing."
        />
      </Head>
      <BubbleBlasterLayout />
    </>
  );
}
