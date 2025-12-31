import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";

// local
import { EditorContextProvider } from "@/context/Editor";
import { AuthContextProvider } from "@/context/User";
import SavePresetModal from "@/components/common/SavePresetModal";
import MobileNav from "@/components/common/MobileNav";
import { InstallPrompt, OfflineIndicator } from "@/components/common/PWAPrompts";

const defaultFont = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Service worker registration failed:', err);
      });
    }
  }, []);
  return (
    <EditorContextProvider>
      <AuthContextProvider>
        <style jsx global>{`
          html {
            font-family: ${defaultFont.style.fontFamily};
          }
        `}</style>
        <OfflineIndicator />
        <Component {...pageProps} />
        <MobileNav />
        <InstallPrompt />
        <Analytics />
        <Toaster
          toastOptions={{
            style: {
              background: "#F26520",
              boxShadow: "none",
              color: "#f2f2f2",
            },
            icon: "👏",
          }}
        />
        <SavePresetModal />
      </AuthContextProvider>
    </EditorContextProvider>
  );
}
