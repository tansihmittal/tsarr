import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with syntax highlighting
const CodeEditorLayout = dynamic(
  () => import("@/components/code-editor/CodeEditorLayout"),
  { ssr: false }
);

export default function CodeEditorPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Code Screenshot Editor</title>
        <meta
          name="description"
          content="Create beautiful code screenshots with syntax highlighting"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CodeEditorLayout />
    </>
  );
}
