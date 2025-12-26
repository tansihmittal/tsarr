import Head from "next/head";

import EditorLayout from "@/components/layouts/EditorLayout";
import ControlPanel from "@/components/edtior/controls/ControlPanel";
import Editor from "@/components/edtior/Editor/Editor";

export default function EditorPage() {
  return (
    <>
      <Head>
        <title>tsarr.in | Screenshot Editor</title>
        <meta name="description" content="Beautiful screenshot editor - Transform your screenshots with powerful editing tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <EditorLayout>
        <Editor />
        <ControlPanel />
      </EditorLayout>
    </>
  );
}
