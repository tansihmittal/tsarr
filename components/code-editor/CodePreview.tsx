import { RefObject, useEffect, useState, ReactNode } from "react";
import { CodeEditorState } from "./CodeEditorLayout";
import { themes, languageKeywords, ThemeColors } from "../../data/codeEditor";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsRepeat, BsShare } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { shareImage } from "../../utils/share";

interface Props {
  state: CodeEditorState;
  previewRef: RefObject<HTMLDivElement>;
  onExport: (format: "png" | "jpeg" | "svg", scale?: number) => void;
  onCopy: () => void;
}

// Syntax highlighter that uses theme colors - processes line by line
const highlightLine = (line: string, language: string, theme: ThemeColors, keywords: string[]) => {
  // First escape HTML
  let result = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Check if line is a comment (starts with // or #)
  const singleLineComment = result.match(/^(\s*)(\/\/.*)$/);
  if (singleLineComment) {
    return `${singleLineComment[1]}<span style="color: ${theme.comment}; font-style: italic">${singleLineComment[2]}</span>`;
  }

  const hashComment = result.match(/^(\s*)(#(?!include|define|ifdef|ifndef|endif|pragma).*)$/);
  if (hashComment) {
    return `${hashComment[1]}<span style="color: ${theme.comment}; font-style: italic">${hashComment[2]}</span>`;
  }

  // Handle inline comments - split line at //
  const inlineCommentMatch = result.match(/^(.*?)(\/\/.*)$/);
  let codePart = result;
  let commentPart = "";
  if (inlineCommentMatch) {
    codePart = inlineCommentMatch[1];
    commentPart = `<span style="color: ${theme.comment}; font-style: italic">${inlineCommentMatch[2]}</span>`;
  }

  // Process the code part
  // Strings
  codePart = codePart
    .replace(/("(?:[^"\\]|\\.)*")/g, `<span style="color: ${theme.string}">$1</span>`)
    .replace(/('(?:[^'\\]|\\.)*')/g, `<span style="color: ${theme.string}">$1</span>`)
    .replace(/(\`(?:[^\`\\]|\\.)*\`)/g, `<span style="color: ${theme.string}">$1</span>`);

  // Numbers (but not inside already highlighted spans)
  codePart = codePart.replace(/\b(\d+\.?\d*)\b(?![^<]*>)/g, `<span style="color: ${theme.number}">$1</span>`);

  // Keywords
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, "g");
    codePart = codePart.replace(regex, `<span style="color: ${theme.keyword}">$1</span>`);
  });

  // Function calls
  codePart = codePart.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\((?![^<]*>)/g,
    `<span style="color: ${theme.function}">$1</span>(`
  );

  // Class names (PascalCase)
  codePart = codePart.replace(
    /\b([A-Z][a-zA-Z0-9_]*)\b(?![^<]*>)/g,
    `<span style="color: ${theme.className}">$1</span>`
  );

  return codePart + commentPart;
};

const highlightCode = (code: string, language: string, theme: ThemeColors) => {
  const keywords = languageKeywords[language] || languageKeywords.javascript;
  
  return code
    .split("\n")
    .map((line) => highlightLine(line, language, theme, keywords))
    .join("\n");
};


const CodePreview: React.FC<Props> = ({ state, previewRef, onExport, onCopy }) => {
  const [highlightedCode, setHighlightedCode] = useState("");
  
  // Get the current theme - fallback to dracula if not found
  // Use useMemo to ensure theme is recalculated when state.theme changes
  const theme: ThemeColors = themes[state.theme] || themes.dracula;

  useEffect(() => {
    setHighlightedCode(highlightCode(state.code, state.language, theme));
  }, [state.code, state.language, state.theme, theme]);

  // Helper function to get shadow style CSS value
  const getShadowValue = (shadowStyle: string) => {
    const shadowMap: Record<string, string> = {
      none: "none",
      subtle: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      medium: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
      strong: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
      bottom: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
    };
    return shadowMap[shadowStyle] || shadowMap.strong;
  };

  // Helper function to get border style CSS
  const getBorderStyle = (borderStyle: string, isDark: boolean) => {
    const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const borderColorGlass = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
    const borderMap: Record<string, { border: string; backdropFilter?: string; background?: string }> = {
      none: { border: "none" },
      solid: { border: `1px solid ${borderColor}` },
      glass: { border: `1px solid ${borderColorGlass}`, backdropFilter: "blur(10px)" },
      gradient: { border: "1px solid transparent", background: `linear-gradient(45deg, ${borderColor}, ${borderColorGlass})` },
    };
    return borderMap[borderStyle] || borderMap.none;
  };

  const borderStyle = getBorderStyle(state.borderStyle, theme.isDark);
  const shadowValue = getShadowValue(state.shadowStyle);

  // Option button component matching other editors
  const OptionButtonOutline = ({
    title,
    onTap,
    children,
    disabled,
  }: {
    children: ReactNode;
    title: string;
    onTap?: () => void;
    disabled?: boolean;
  }) => (
    <div
      className={`text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect"
      }`}
      onClick={disabled ? undefined : onTap}
    >
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  const handleReset = () => {
    // Reset code to default
    window.location.reload();
  };


  // Window component for reuse in main and reflection
  const WindowComponent = ({ isReflection = false }: { isReflection?: boolean }) => (
    <div
      className="scrollbar-hide"
      style={{
        backgroundColor: theme.bg,
        borderRadius: Math.max(0, state.borderRadius - 8),
        overflow: "hidden",
        border: borderStyle.border,
        backdropFilter: borderStyle.backdropFilter,
        boxShadow: isReflection ? "none" : shadowValue,
      }}
    >
      {/* Window Header */}
      {state.headerVisible && state.windowStyle !== "none" && (
        <div
          className="flex items-center px-4 py-3 relative"
          style={{ 
            backgroundColor: state.windowBackground === "alternative" 
              ? (theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)")
              : theme.bg,
            borderBottom: `1px solid ${theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          }}
        >
          {state.windowStyle === "macos" && (
            <div className="flex gap-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
            </div>
          )}
          {state.windowStyle === "windows" && (
            <div className="flex gap-2 ml-auto">
              <div className="w-3 h-3 flex items-center justify-center text-xs" style={{ color: theme.comment }}>─</div>
              <div className="w-3 h-3 flex items-center justify-center text-xs" style={{ color: theme.comment }}>□</div>
              <div className="w-3 h-3 flex items-center justify-center text-xs" style={{ color: theme.comment }}>×</div>
            </div>
          )}
          {state.windowTitle && state.windowStyle === "macos" && (
            <span
              className="text-sm opacity-60 flex-1 text-center -ml-16"
              style={{ color: theme.text }}
            >
              {state.windowTitle}
            </span>
          )}
          {state.windowTitle && state.windowStyle === "windows" && (
            <span
              className="text-sm opacity-60 absolute left-4"
              style={{ color: theme.text }}
            >
              {state.windowTitle}
            </span>
          )}
        </div>
      )}


      {/* Code Content */}
      <div className="code-content-area scrollbar-hide" style={{ padding: "16px 20px", overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", borderSpacing: 0 }}>
          <tbody>
            {highlightedCode.split("\n").map((line, i) => (
              <tr key={i} style={{ lineHeight: "1.6" }}>
                {state.lineNumbers && (
                  <td
                    className="select-none"
                    style={{
                      color: theme.lineNumber,
                      fontSize: state.fontSize,
                      fontFamily: state.fontFamily,
                      textAlign: "right",
                      paddingRight: "16px",
                      verticalAlign: "top",
                      userSelect: "none",
                    }}
                  >
                    {i + state.lineStart}
                  </td>
                )}
                <td
                  style={{
                    color: theme.text,
                    fontSize: state.fontSize,
                    fontFamily: state.fontFamily,
                    fontVariantLigatures: state.ligatures ? "normal" : "none",
                    whiteSpace: "pre",
                  }}
                  dangerouslySetInnerHTML={{ __html: line || " " }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Top options - matching other editors */}
      <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center">
        <div className="dropdown">
          <label tabIndex={0}>
            <OptionButtonOutline title="Export Image">
              <TfiExport />
            </OptionButtonOutline>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50"
          >
            <li onClick={() => onExport("png", 1)}><a>Export as PNG 1x</a></li>
            <li onClick={() => onExport("png", 2)}><a>Export as PNG 2x</a></li>
            <li onClick={() => onExport("png", 4)}><a>Export as PNG 4x</a></li>
            <li onClick={() => onExport("svg", 2)}><a>Export as SVG</a></li>
            <li onClick={() => onExport("jpeg", 2)}><a>Export as JPEG</a></li>
          </ul>
        </div>

        <OptionButtonOutline title="Copy to Clipboard" onTap={onCopy}>
          <BsClipboard className="icon" />
        </OptionButtonOutline>

        <OptionButtonOutline title="Reset" onTap={handleReset}>
          <BiReset className="icon" />
        </OptionButtonOutline>

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
          style={{
            background: state.frameVisible ? state.background.background : "transparent",
            padding: state.frameVisible ? state.padding : 0,
            borderRadius: state.frameVisible ? state.canvasRoundness : 0,
            boxShadow: state.frameVisible ? state.shadow : "none",
            ...(state.aspectRatio.value !== "auto" && {
              aspectRatio: state.aspectRatio.value,
              minWidth: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }),
            perspective: "1000px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Noise overlay */}
          {state.noise && state.frameVisible && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                borderRadius: state.canvasRoundness,
                opacity: 0.08,
              }}
            />
          )}
          <div 
            className="relative flex flex-col" 
            key={state.theme} 
            style={{ 
              transform: `${state.tilt.value} translateX(${state.left}px) translateY(${state.top}px) rotate(${state.rotate}deg) scale(${state.scale})`,
              transformStyle: "preserve-3d", 
              transition: "transform 0.3s ease" 
            }}
          >
            {/* Main Window */}
            <WindowComponent />


          {/* Reflection - proper gradient fade effect */}
          {state.reflection && (
            <div 
              className="relative overflow-hidden"
              style={{
                marginTop: "4px",
                height: "80px",
                transform: "scaleY(-1)",
                maskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.15) 60%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.15) 60%, transparent 100%)",
                opacity: 0.4,
                filter: "blur(0.5px)",
              }}
            >
              <div
                style={{
                  backgroundColor: theme.bg,
                  borderRadius: Math.max(0, state.borderRadius - 8),
                  overflow: "hidden",
                }}
              >
                {/* Simplified header for reflection */}
                {state.headerVisible && state.windowStyle !== "none" && (
                  <div
                    className="flex items-center px-4 py-3"
                    style={{ 
                      backgroundColor: state.windowBackground === "alternative" 
                        ? (theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)")
                        : theme.bg,
                    }}
                  >
                    {state.windowStyle === "macos" && (
                      <div className="flex gap-2 mr-4">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
                      </div>
                    )}
                  </div>
                )}
                {/* Code preview for reflection */}
                <div className="overflow-hidden" style={{ padding: "16px 20px", maxHeight: "60px" }}>
                  <table style={{ borderCollapse: "collapse", borderSpacing: 0 }}>
                    <tbody>
                      {highlightedCode.split("\n").slice(0, 3).map((line, i) => (
                        <tr key={i} style={{ lineHeight: "1.6" }}>
                          {state.lineNumbers && (
                            <td
                              className="select-none"
                              style={{
                                color: theme.lineNumber,
                                fontSize: state.fontSize,
                                fontFamily: state.fontFamily,
                                textAlign: "right",
                                paddingRight: "16px",
                                verticalAlign: "top",
                                userSelect: "none",
                              }}
                            >
                              {i + state.lineStart}
                            </td>
                          )}
                          <td
                            style={{
                              color: theme.text,
                              fontSize: state.fontSize,
                              fontFamily: state.fontFamily,
                              whiteSpace: "pre",
                            }}
                            dangerouslySetInnerHTML={{ __html: line || " " }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* Watermark */}
          {state.watermark.visible && state.watermark.text && (
            <div
              className="absolute bottom-2 right-2 pointer-events-none select-none"
              style={{
                color: theme.text,
                fontSize: Math.max(10, state.fontSize - 4),
                fontFamily: state.fontFamily,
                opacity: 0.4,
                textShadow: theme.isDark ? "0 1px 2px rgba(0,0,0,0.5)" : "0 1px 2px rgba(255,255,255,0.5)",
              }}
            >
              {state.watermark.text}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default CodePreview;