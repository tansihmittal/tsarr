import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { BsApple, BsGooglePlay, BsArrowRight } from "react-icons/bs";

// Bounce page for the QR "Application" type: a QR code can only encode one
// static link, so choosing iOS vs Android at scan time requires a page that
// actually runs on a device — this is that page. It reads ?ios= and
// ?android= from the URL, detects the visitor's platform, and forwards them
// immediately. Manual buttons stay visible underneath in case auto-redirect
// is blocked or detection is ambiguous (e.g. desktop browsers).

type Platform = "ios" | "android" | "other";

// Store links come from a QR code's URL query params, which are attacker-
// controllable (a scanned code can point anywhere) — only allow schemes that
// can't run script before they're ever assigned to location or an <a href>.
const SAFE_LINK_SCHEMES = /^https?:/i;
function sanitizeStoreLink(url: string): string {
  const href = (url || "").trim();
  if (!href) return "";
  return SAFE_LINK_SCHEMES.test(href) ? href : "";
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "android";
  const isClassicIOS = /iPad|iPhone|iPod/i.test(ua) && !(window as any).MSStream;
  // iPadOS 13+ reports as "Macintosh" in the UA string but is touch-capable,
  // unlike a real Mac — this catches it.
  const isModerniPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (isClassicIOS || isModerniPad) return "ios";
  return "other";
}

export default function AppLinkRedirect() {
  const router = useRouter();
  const [iosUrl, setIosUrl] = useState("");
  const [androidUrl, setAndroidUrl] = useState("");
  const [status, setStatus] = useState<"detecting" | "redirecting" | "choose">("detecting");

  useEffect(() => {
    if (!router.isReady) return;

    const ios = sanitizeStoreLink(typeof router.query.ios === "string" ? router.query.ios : "");
    const android = sanitizeStoreLink(typeof router.query.android === "string" ? router.query.android : "");
    setIosUrl(ios);
    setAndroidUrl(android);

    const platform = detectPlatform();
    const target = platform === "ios" ? ios : platform === "android" ? android : "";

    if (target) {
      setStatus("redirecting");
      window.location.replace(target);
    } else {
      setStatus("choose");
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>Redirecting… | tsarr.in</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main
        className="min-h-screen flex items-center justify-center bg-[#FBFBFD] dark:bg-gray-900 px-6"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center">
            {status === "choose" ? (
              <BsArrowRight className="text-2xl text-[#2563EB]" />
            ) : (
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <h1 className="text-lg font-semibold text-[#0A0A0A] dark:text-white mb-1">
            {status === "choose" ? "Choose your platform" : "Taking you to the app…"}
          </h1>
          <p className="text-sm text-[#4B5563] dark:text-gray-400 mb-6">
            {status === "choose"
              ? "We couldn't detect your device automatically."
              : "You'll be redirected in a moment."}
          </p>

          <div className="flex flex-col gap-2.5">
            {iosUrl && (
              <a
                href={iosUrl}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] bg-[#0A0A0A] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <BsApple className="text-base" /> Download on the App Store
              </a>
            )}
            {androidUrl && (
              <a
                href={androidUrl}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 text-[#0A0A0A] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <BsGooglePlay className="text-base" /> Get it on Google Play
              </a>
            )}
            {!iosUrl && !androidUrl && (
              <p className="text-sm text-[#4B5563]/60">No app links were provided.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
