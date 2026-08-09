import { RefObject } from "react";
import ToolbarButton from "../common/ToolbarButton";
import { CarouselEditorState } from "./CarouselEditorLayout";
import { TfiExport } from "react-icons/tfi";
import { BsClipboard, BsChevronLeft, BsChevronRight, BsGlobe, BsShare } from "react-icons/bs";
import { BiReset } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import { shareImage } from "../../utils/share";
import ProjectNameHeader from "../common/ProjectNameHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  state: CarouselEditorState;
  previewRef: RefObject<HTMLDivElement>;
  onExport: (format: "png" | "jpeg" | "svg" | "webp", scale?: number) => void;
  onExportAll: () => void;
  onCopy: () => void;
  updateState: (updates: Partial<CarouselEditorState>) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  isSaving: boolean;
}

const CarouselPreview: React.FC<Props> = ({ state, previewRef, onExport, onExportAll, onCopy, updateState, projectName, onProjectNameChange, isSaving }) => {
  const currentSlideData = state.slides[state.currentSlide];


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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <BsGlobe style={{ color: state.websiteUrlColor }} />
        <span className="text-sm font-medium" style={{ color: state.websiteUrlColor }}>{currentSlideData.websiteUrl}</span>
      </div>
    );
  };

  // App Icon component
  const AppIcon = () => {
    if (!currentSlideData.appIcon) return null;
    return (
      <div className="w-16 h-16 rounded-[20px] overflow-hidden shadow-lg">
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

      <div className="flex flex-wrap gap-2 w-full mb-3 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span><ToolbarButton title="Export"><TfiExport /></ToolbarButton></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px] z-50">
            <DropdownMenuItem onClick={() => onExport("png", 1)}>PNG 1x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("png", 2)}>PNG 2x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("png", 4)}>PNG 4x</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("jpeg", 2)}>JPEG</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("webp", 2)}>WebP</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton title="Export All" onTap={onExportAll}><FiDownload /></ToolbarButton>
        <ToolbarButton title="Copy" onTap={onCopy}><BsClipboard /></ToolbarButton>
        <ToolbarButton title="Reset" onTap={handleReset}><BiReset /></ToolbarButton>
        <ToolbarButton title="Share" onTap={() => shareImage(previewRef.current)}><BsShare /></ToolbarButton>
      </div>

      <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-[20px] bg-[#F3F4F6] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 overflow-hidden py-8">
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
                      <div className="inline-block px-5 py-2.5 font-semibold text-sm rounded-[10px]" style={{ backgroundColor: state.headlineColor, color: state.background.color1 || "#fff" }}>
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
        <Button
          size="icon"
          variant="secondary"
          onClick={goToPrevSlide}
          disabled={state.currentSlide === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-900 shadow-lg"
        >
          <BsChevronLeft className="text-xl" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={goToNextSlide}
          disabled={state.currentSlide === state.slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-900 shadow-lg"
        >
          <BsChevronRight className="text-xl" />
        </Button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {state.slides.map((_, index) => (
            <button
              key={index}
              onClick={() => updateState({ currentSlide: index })}
              className={`h-2.5 rounded-full transition-all ${index === state.currentSlide ? "bg-[#2563EB] w-6" : "bg-[#E5E7EB] hover:bg-[#D1D5DB] w-2.5"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselPreview;
