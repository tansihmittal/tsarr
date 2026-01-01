import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SplashScreen = ({ onComplete, minDuration = 1200 }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, minDuration / 25);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 300);
    }, minDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete, minDuration]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">ts</span>
        </div>
      </div>

      {/* App name */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
        tsarr.in
      </h1>
      <p className="text-gray-500 text-sm font-medium mb-2">
        Screenshot Editor
      </p>
      
      {/* Tagline */}
      <p className="text-indigo-600 text-xs font-semibold tracking-wide mb-8">
        Make it the Tsarr way ✨
      </p>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Loading text */}
      <p className="text-gray-400 text-xs mt-3">
        Loading...
      </p>
    </div>
  );
};

export default SplashScreen;
