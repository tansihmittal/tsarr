import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const TweetEditorLayout = dynamic(
  () => import("@/components/tweet-editor/TweetEditorLayout"),
  { ssr: false }
);

export default function TweetEditorPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Tweet Screenshot Editor</title>
        <meta
          name="description"
          content="Create beautiful tweet screenshots for social media"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TweetEditorLayout />
    </>
  );
}
