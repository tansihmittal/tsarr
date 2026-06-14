import dynamic from "next/dynamic";
import Head from "next/head";

const QrCodeLayout = dynamic(
  () => import("../components/qr-code/QrCodeLayout"),
  { ssr: false }
);

const QrCodePage = () => {
  return (
    <>
      <Head>
        <title>QR Code Generator | Create QR Codes Instantly</title>
        <meta
          name="description"
          content="Generate QR codes for URLs, text, email, phone, and WiFi. Customize colors, size, and error correction. Free, no login required."
        />
      </Head>
      <QrCodeLayout />
    </>
  );
};

export default QrCodePage;
