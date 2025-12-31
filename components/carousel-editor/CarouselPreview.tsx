import { RefObject, ReactNode } from "react";
import { CarouselEditorState } from "./CarouselEditorLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsChevronLeft, BsChevronRight, BsGlobe, BsShare } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import { shareImage } from "../../utils/share";
import ProjectNameHeader from "../common/ProjectNameHeader";

interface Props {
  state: CarouselEditorState;
  previewRef: RefObject<HTMLDivElement>;
  onExport: (format: "png" | "jpeg" | "svg", scale?: number) => void;
  onExportAll: () => void;
  onCopy: () => void;
  updateState: (updates: Partial<CarouselEditorState>) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  isSaving: boolean;
}

const CarouselPreview: React.FC<Props> = ({ state, previewRef, onExport, onExportAll, onCopy, updateState, projectName, onProjectNameChange, isSaving }) => {
  const currentSlideData = state.slides[state.currentSlide];

  const OptionButtonOutline = ({ title, onTap, children }: { children: ReactNode; title: string; onTap?: () => void }) => (
    <div className="text-primary-content bg-base-100 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-base-200 rounded-lg transition-all duration-200 hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm cursor-pointer press-effect" onClick={onTap}>
      <span className="text-lg">{children}</span>
      <span className="font-medium">{title}</span>
    </div>
  );

  const handleReset = () => window.location.reload();
  const goToPrevSlide = () => { if (state.currentSlide > 0) updateState({ currentSlide: state.currentSlide - 1 }); };
  const goToNextSlide = () => { if (state.currentSlide < state.slides.length - 1) updateState({ currentSlide: state.currentSlide + 1 }); };

  const ProfileSection = () => (
    <div className="flex items-center gap-3">
      {state.profileImage ? (
        <img src={state.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold" style={{ color: state.headlineColor }}>
          {state.profileName.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className="font-semibold text-sm" style={{ color: state.headlineColor }}>{state.profileName}</div>
        <div className="text-xs" style={{ color: state.subheadlineColor }}>{state.profileHandle}</div>
      </div>
    </div>
  );

  const SwipeIndicator = () => {
    if (!state.showSwipeIndicator) return null;
    if (state.swipeIndicatorStyle === "dots") {
      return (
        <div className="flex gap-1.5 justify-center">
          {state.slides.map((_, index) => (
            <div key={index} className={`w-2 h-2 rounded-full transition-all ${index === state.currentSlide ? "w-4" : ""}`} style={{ backgroundColor: index === state.currentSlide ? state.headlineColor : `${state.headlineColor}40` }} />
          ))}
        </div>
      );
    }
    if (state.swipeIndicatorStyle === "numbers") {
      return <div className="text-center text-sm font-medium" style={{ color: state.subheadlineColor }}>{state.currentSlide + 1} / {state.slides.length}</div>;
    }
    return <div className="flex items-center justify-center gap-2 text-sm" style={{ color: state.subheadlineColor }}><BsChevronLeft /> Swipe <BsChevronRight /></div>;
  };

  const PageNumber = () => {
    if (!state.showPageNumber) return null;
    const positions: Record<string, string> = {
      "top-left": "top-4 left-4", "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4", "bottom-right": "bottom-4 right-4",
    };
    return (
      <div className={`absolute ${positions[state.pageNumberPosition]} text-sm font-bold px-3 py-1 rounded-full`} style={{ backgroundColor: `${state.headlineColor}10`, color: state.headlineColor }}>
        {state.currentSlide + 1}/{state.slides.length}
      </div>
    );
  };

  // Website link component
  const WebsiteLink = () => {
    if (!currentSlideData.websiteUrl) return null;
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm">
        <BsGlobe style={{ color: state.websiteUrlColor }} />
        <span className="text-sm font-medium" style={{ color: state.websiteUrlColor }}>{currentSlideData.websiteUrl}</span>
      </div>
    );
  };

  // App Icon component
  const AppIcon = () => {
    if (!currentSlideData.appIcon) return null;
    return (
      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
        <img src={currentSlideData.appIcon} alt="" className="w-full h-full object-cover" />
      </div>
    );
  };

  return (
    <div className="flex items-center justify-start flex-col h-full w-full">
      {/* Project Name */}
      <ProjectNameHeader
        name={projectName}
        onNameChange={onProjectNameChange}
        isSaving={isSaving}
      />

      <div className="grid grid-cols-2 gap-2 w-full mb-3 lg:flex lg:justify-end lg:items-center">
        <div className="dropdown">
          <label tabIndex={0}><OptionButtonOutline title="Export"><TfiExport /></OptionButtonOutline></label>
          <ul tabIndex={0} className="dropdown-content p-2 mt-1 menu bg-base-100 w-full min-w-[262px] border-2 rounded-md z-50">
            <li onClick={() => onExport("png", 1)}><a>PNG 1x</a></li>
            <li onClick={() => onExport("png", 2)}><a>PNG 2x</a></li>
            <li onClick={() => onExport("png", 4)}><a>PNG 4x</a></li>
            <li onClick={() => onExport("jpeg", 2)}><a>JPEG</a></li>
          </ul>
        </div>
        <OptionButtonOutline title="Export All" onTap={onExportAll}><FiDownload /></OptionButtonOutline>
        <OptionButtonOutline title="Copy" onTap={onCopy}><BsClipboard /></OptionButtonOutline>
        <OptionButtonOutline title="Reset" onTap={handleReset}><BiReset /></OptionButtonOutline>
        <OptionButtonOutline title="Share" onTap={() => shareImage(previewRef.current)}><BsShare /></OptionButtonOutline>
      </div>

      <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden py-8">
        <div
          ref={previewRef}
          className="relative overflow-hidden"
          style={{
            width: "400px",
            aspectRatio: state.aspectRatio.value,
            background: state.background.background,
            borderRadius: state.borderRadius,
            padding: state.padding,
          }}
        >
          <PageNumber />

          <div className="relative h-full flex flex-col" style={{ textAlign: state.textAlign }}>
            {/* Profile - Top */}
            {state.showProfile && state.profilePosition === "top" && <div className="mb-4"><ProfileSection /></div>}

            {/* App Showcase Layout */}
            {state.slideLayout === "app-showcase" ? (
              <div className="flex-1 flex flex-col justify-between">
                {/* Top section: Website */}
                <div className={`flex items-center gap-3 mb-4 ${state.textAlign === "center" ? "justify-center" : state.textAlign === "right" ? "justify-end" : "justify-start"} flex-wrap`}>
                  <WebsiteLink />
                </div>

                {/* Middle: App Icon + Text */}
                <div className="flex-1 flex flex-col justify-center">
                  {currentSlideData.appIcon && (
                    <div className={`mb-4 ${state.textAlign === "center" ? "flex justify-center" : state.textAlign === "right" ? "flex justify-end" : ""}`}>
                      <AppIcon />
                    </div>
                  )}

                  {currentSlideData.showNumber && currentSlideData.number && (
                    <div className="text-6xl font-bold mb-2" style={{ color: `${state.headlineColor}20` }}>{currentSlideData.number}</div>
                  )}

                  {currentSlideData.headline && (
                    <h1 style={{ fontSize: state.headlineSize, fontWeight: state.headlineWeight, color: state.headlineColor, marginBottom: "8px", lineHeight: 1.2 }}>
                      {currentSlideData.headline}
                    </h1>
                  )}
                  {currentSlideData.subheadline && (
                    <h2 style={{ fontSize: state.subheadlineSize, color: state.subheadlineColor, marginBottom: "12px", lineHeight: 1.4 }}>
                      {currentSlideData.subheadline}
                    </h2>
                  )}
                  {currentSlideData.description && (
                    <p style={{ fontSize: state.descriptionSize, color: state.descriptionColor, lineHeight: 1.6 }}>
                      {currentSlideData.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Screenshot Image with shadow */}
                {currentSlideData.image && (
                  <div className="mt-4">
                    <img
                      src={currentSlideData.image}
                      alt=""
                      className="w-full object-cover"
                      style={{
                        borderRadius: state.imageRadius,
                        boxShadow: state.imageShadow,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Other layouts */
              <div className={`flex-1 flex flex-col ${state.slideLayout === "image-top" ? "" : state.slideLayout === "image-bottom" ? "flex-col-reverse" : ""}`}>
                {currentSlideData.image && state.slideLayout !== "text-only" && (
                  <div className={`${state.slideLayout === "image-top" ? "mb-4" : "mt-4"}`}>
                    <img src={currentSlideData.image} alt="" className="w-full object-cover" style={{ borderRadius: state.imageRadius, boxShadow: state.imageShadow }} />
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  {currentSlideData.showNumber && currentSlideData.number && (
                    <div className="text-6xl font-bold mb-2" style={{ color: `${state.headlineColor}20` }}>{currentSlideData.number}</div>
                  )}
                  {currentSlideData.headline && <h1 style={{ fontSize: state.headlineSize, fontWeight: state.headlineWeight, color: state.headlineColor, marginBottom: "8px", lineHeight: 1.2 }}>{currentSlideData.headline}</h1>}
                  {currentSlideData.subheadline && <h2 style={{ fontSize: state.subheadlineSize, color: state.subheadlineColor, marginBottom: "12px", lineHeight: 1.4 }}>{currentSlideData.subheadline}</h2>}
                  {currentSlideData.description && <p style={{ fontSize: state.descriptionSize, color: state.descriptionColor, lineHeight: 1.6 }}>{currentSlideData.description}</p>}
                  
                  {currentSlideData.ctaVisible && currentSlideData.ctaText && (
                    <div className={`mt-4 ${state.textAlign === "center" ? "flex justify-center" : state.textAlign === "right" ? "flex justify-end" : ""}`}>
                      <div className="inline-block px-5 py-2.5 font-semibold text-sm rounded-lg" style={{ backgroundColor: state.headlineColor, color: state.background.color1 || "#fff" }}>
                        {currentSlideData.ctaText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom section */}
            <div className="mt-4 space-y-3">
              {state.showProfile && state.profilePosition === "bottom" && <ProfileSection />}
              <SwipeIndicator />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <button onClick={goToPrevSlide} disabled={state.currentSlide === 0} className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-base-100 shadow-lg flex items-center justify-center transition-all ${state.currentSlide === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-base-200 cursor-pointer"}`}>
          <BsChevronLeft className="text-xl" />
        </button>
        <button onClick={goToNextSlide} disabled={state.currentSlide === state.slides.length - 1} className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-base-100 shadow-lg flex items-center justify-center transition-all ${state.currentSlide === state.slides.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-base-200 cursor-pointer"}`}>
          <BsChevronRight className="text-xl" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {state.slides.map((_, index) => (
            <button key={index} onClick={() => updateState({ currentSlide: index })} className={`w-2.5 h-2.5 rounded-full transition-all ${index === state.currentSlide ? "bg-primary w-6" : "bg-base-300 hover:bg-base-400"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselPreview;
