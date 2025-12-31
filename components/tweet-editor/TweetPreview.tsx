import { RefObject, ReactNode, useRef } from "react";
import { TweetEditorState } from "./TweetEditorLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsShare } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { shareImage } from "../../utils/share";

interface Props {
  state: TweetEditorState;
  previewRef: RefObject<HTMLDivElement>;
  onExport: (format: "png" | "jpeg" | "svg", scale?: number) => void;
  onCopy: () => void;
  updateState: (updates: Partial<TweetEditorState>) => void;
}

const TWITTER_CHAR_LIMIT = 280;

const themeColors = {
  light: { bg: "#ffffff", text: "#0f1419", secondary: "#536471", border: "#eff3f4" },
  dark: { bg: "#15202b", text: "#f7f9f9", secondary: "#8b98a5", border: "#38444d" },
  dim: { bg: "#1e1e1e", text: "#e7e9ea", secondary: "#71767b", border: "#2f3336" },
};

const TweetPreview: React.FC<Props> = ({ state, previewRef, onExport, onCopy, updateState }) => {
  const colors = themeColors[state.theme];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charCount = state.tweetText.length;
  const isOverLimit = charCount > TWITTER_CHAR_LIMIT;

  const formatTimestamp = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${formattedHours}:${formattedMinutes} ${ampm} · ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getSourceText = () => {
    switch (state.source) {
      case "ios": return "Twitter for iPhone";
      case "android": return "Twitter for Android";
      default: return "Twitter Web App";
    }
  };

  const OptionButtonOutline = ({ title, onTap, children }: { children: ReactNode; title: string; onTap?: () => void }) => (
    <div
      className="text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"
      onClick={onTap}
    >
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  const handleReset = () => window.location.reload();
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => updateState({ avatarUrl: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const VerifiedBadge = () => (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="#1d9bf0">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
    </svg>
  );

  const DefaultAvatar = () => (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: "#1d9bf0" }}
      onClick={handleAvatarClick}
    >
      {state.displayName.charAt(0).toUpperCase() || "U"}
    </div>
  );

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />

      {/* Top options */}
      <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center">
        <div className="dropdown">
          <label tabIndex={0}>
            <OptionButtonOutline title="Export Image"><TfiExport /></OptionButtonOutline>
          </label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50">
            <li onClick={() => onExport("png", 1)}><a>Export as PNG 1x</a></li>
            <li onClick={() => onExport("png", 2)}><a>Export as PNG 2x</a></li>
            <li onClick={() => onExport("png", 4)}><a>Export as PNG 4x</a></li>
            <li onClick={() => onExport("svg", 2)}><a>Export as SVG</a></li>
            <li onClick={() => onExport("jpeg", 2)}><a>Export as JPEG</a></li>
          </ul>
        </div>
        <OptionButtonOutline title="Copy to Clipboard" onTap={onCopy}><BsClipboard /></OptionButtonOutline>
        <OptionButtonOutline title="Reset" onTap={handleReset}><BiReset /></OptionButtonOutline>
        <div
          className="text-white bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 px-4 flex items-center justify-center gap-2.5 rounded-lg transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 cursor-pointer press-effect"
          onClick={() => shareImage(previewRef.current)}
        >
          <BsShare className="text-lg" />
          <span className="font-medium">Share</span>
        </div>
      </div>

      {/* Editor Canvas Area */}
      <div className="relative w-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden py-8">
        <div
          ref={previewRef}
          className="flex flex-col items-center justify-center relative"
          style={{
            background: state.frameVisible ? state.background.background : "transparent",
            padding: state.frameVisible ? state.padding : 0,
            borderRadius: state.frameVisible ? state.canvasRoundness : 0,
            perspective: "1000px",
          }}
        >
          {/* Noise overlay */}
          {state.noise && (
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                borderRadius: "inherit",
              }}
            />
          )}

          {/* Tweet Card */}
          <div
            className="w-[500px]"
            style={{
              backgroundColor: colors.bg,
              borderRadius: state.borderRadius,
              boxShadow: state.shadow,
              transform: `${state.tilt.value} translateX(${state.left}px) translateY(${state.top}px) rotate(${state.rotate}deg) scale(${state.scale})`,
              transformStyle: "preserve-3d",
              transition: "transform 0.3s ease",
            }}
          >
            <div className="p-4">
              {/* Header - Fixed layout */}
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {state.avatarUrl ? (
                    <img
                      src={state.avatarUrl}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleAvatarClick}
                    />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>

                {/* Name section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5">
                    <span className="font-bold text-[15px] truncate" style={{ color: colors.text }}>
                      {state.displayName || "Name"}
                    </span>
                    {state.verified && <VerifiedBadge />}
                  </div>
                  <div className="text-[14px]" style={{ color: colors.secondary }}>
                    @{state.username || "username"}
                  </div>
                </div>

                {/* X logo */}
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill={colors.text}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </div>

              {/* Tweet text - Display only, no input */}
              <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: colors.text }}>
                {state.tweetText || "What's happening?"}
              </div>

              {/* Timestamp */}
              {state.showTimestamp && (
                <div className="mt-3 text-[13px] flex items-center gap-1" style={{ color: colors.secondary }}>
                  <span>{formatTimestamp(state.date)}</span>
                  {state.showSource && (
                    <>
                      <span>·</span>
                      <span className="text-[#1d9bf0]">{getSourceText()}</span>
                    </>
                  )}
                </div>
              )}

              {/* Metrics */}
              {state.showMetrics && state.cardStyle !== "minimal" && (
                <div className="mt-3 pt-3 flex items-center gap-4 text-[14px] flex-wrap" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <div>
                    <span className="font-bold" style={{ color: colors.text }}>{state.retweets}</span>
                    <span style={{ color: colors.secondary }}> Reposts</span>
                  </div>
                  <div>
                    <span className="font-bold" style={{ color: colors.text }}>{state.likes}</span>
                    <span style={{ color: colors.secondary }}> Likes</span>
                  </div>
                  {state.cardStyle === "detailed" && (
                    <>
                      <div>
                        <span className="font-bold" style={{ color: colors.text }}>{state.replies}</span>
                        <span style={{ color: colors.secondary }}> Replies</span>
                      </div>
                      <div>
                        <span className="font-bold" style={{ color: colors.text }}>{state.bookmarks}</span>
                        <span style={{ color: colors.secondary }}> Bookmarks</span>
                      </div>
                      <div>
                        <span className="font-bold" style={{ color: colors.text }}>{state.views}</span>
                        <span style={{ color: colors.secondary }}> Views</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Character count indicator - outside the export area */}
        <div className={`absolute bottom-4 right-4 text-sm font-medium ${isOverLimit ? "text-red-500" : "text-gray-400"}`}>
          {charCount}/{TWITTER_CHAR_LIMIT}
        </div>
      </div>
    </div>
  );
};

export default TweetPreview;
