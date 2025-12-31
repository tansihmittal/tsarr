import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SplashScreen = ({ onComplete, minDuration = 1500 }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 300); // Wait for fade animation
    }, minDuration);

    return () => clearTimeout(timer);
  }, [onComplete, minDuration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-indigo-600 transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="relative mb-6 animate-bounce-slow">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-indigo-900/30 flex items-center justify-center">
          <span className="text-4xl font-bold text-indigo-600">
            ts
          </span>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-24 h-24 bg-white/20 rounded-3xl blur-xl -z-10" />
      </div>

      {/* App name */}
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
        tsarr.in
      </h1>
      <p className="text-indigo-200 text-sm font-medium mb-8">
        Screenshot Editor
      </p>

      {/* Loading indicator */}
      <div className="flex gap-1.5">
        <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse-dot" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default SplashScreen;
