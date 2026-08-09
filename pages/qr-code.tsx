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
        <title>QR Code Generator | Create Custom QR Codes Instantly</title>
        <meta
          name="description"
          content="Generate QR codes for links, WiFi, vCards, events, WhatsApp, UPI payments, crypto, and more. Custom shapes, gradients, logos, frames, and image blends. Free, no login required."
        />
      </Head>
      <QrCodeLayout />
    </>
  );
};

export default QrCodePage;
