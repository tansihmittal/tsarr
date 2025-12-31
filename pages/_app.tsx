import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";

// local
import { EditorContextProvider } from "@/context/Editor";
import { AuthContextProvider } from "@/context/User";
import SavePresetModal from "@/components/common/SavePresetModal";
import MobileNav from "@/components/common/MobileNav";
import { InstallPrompt, OfflineIndicator } from "@/components/common/PWAPrompts";
import SplashScreen from "@/components/common/SplashScreen";
import { initProjectStorage } from "@/utils/projectStorage";

const defaultFont = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

// Check if running as installed PWA
const isPWA = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

export default function App({ Component, pageProps }: AppProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Service worker registration failed:', err);
      });
    }
    // Initialize project storage (cache projects from IndexedDB)
    initProjectStorage();

    // Show splash only for installed PWA on initial load
    const hasSeenSplash = sessionStorage.getItem("splashShown");
    if (isPWA() && !hasSeenSplash) {
      setShowSplash(true);
    } else {
      setIsReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
    setIsReady(true);
  };

  return (
    <EditorContextProvider>
      <AuthContextProvider>
        <style jsx global>{`
          html {
            font-family: ${defaultFont.style.fontFamily};
          }
        `}</style>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        {isReady && (
          <>
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
          </>
        )}
      </AuthContextProvider>
    </EditorContextProvider>
  );
}
