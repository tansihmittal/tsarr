import { RefObject, ReactNode } from "react";
import {
  BsChevronRight,
  BsCheck,
  BsX,
  BsTrash,
  BsLightning,
  BsLightbulb,
  BsPencil,
  BsBullseye,
  BsChatSquareDots,
} from "react-icons/bs";
import { BiRefresh, BiSelectMultiple, BiPointer, BiPencil } from "react-icons/bi";
import { BubbleBlasterState, BubbleRegion } from "./BubbleBlasterLayout";
import ControlPanelHeading from "../common/ControlPanelHeading";
import ControlPanelRow from "../common/ControlPanelRow";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  state: BubbleBlasterState;
  updateState: (updates: Partial<BubbleBlasterState>) => void;
  processSelectedBubbles: () => void;
  redetectBubbles: () => void;
  resetToOriginal: () => void;
  selectAllBubbles: () => void;
  deselectAllBubbles: () => void;
  deleteBubble: (bubbleId: string) => void;
  canvasRef: RefObject<HTMLCanvasElement>;
  workingCanvasRef: RefObject<HTMLCanvasElement>;
}

const PanelHeading = ControlPanelHeading;
const Control = ControlPanelRow;

const BubbleBlasterControls = ({
  state,
  updateState,
  processSelectedBubbles,
  redetectBubbles,
  resetToOriginal,
  selectAllBubbles,
  deselectAllBubbles,
  deleteBubble,
}: Props) => {
  const unprocessedSelected = state.bubbles.filter(
    (b) => b.isSelected && !b.isProcessed
  ).length;

  return (
    <section
      className={`flex flex-col transition-opacity duration-300 ${
        state.image ? "opacity-100" : "opacity-90"
      }`}
      style={{ pointerEvents: state.image ? "auto" : "none" }}
    >
      {/* Main action button */}
      {state.image && (
        <button
          onClick={processSelectedBubbles}
          disabled={unprocessedSelected === 0 || state.isProcessing}
          className={`w-full py-4 mb-3 rounded-[14px] font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            unprocessedSelected > 0 && !state.isProcessing
              ? "bg-gradient-to-r from-[#2563EB] to-purple-600 text-white shadow-lg shadow-[#2563EB]/30 hover:shadow-xl hover:scale-[1.02]"
              : "bg-[#F9FAFB] dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
        >
          <BsLightning className="text-xl" />
          BLAST! ({unprocessedSelected} bubbles)
        </button>
      )}

      <div className="rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:h-[calc(100vh-200px)] lg:overflow-y-scroll scrollbar-hide">
        {state.image && (
          <>
            {/* Mode Selection */}
            <PanelHeading title="Mode" />
            <div className="p-3 flex gap-2">
              <button
                onClick={() => updateState({ mode: "select" })}
                className={`flex-1 py-2.5 px-3 rounded-[10px] font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  state.mode === "select"
                    ? "bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20"
                    : "bg-[#F9FAFB] dark:bg-gray-800 text-[#0A0A0A] dark:text-white hover:bg-[#E5E7EB] dark:hover:bg-gray-700"
                }`}
              >
                <BiPointer />
                Select
              </button>
              <button
                onClick={() => updateState({ mode: "draw" })}
                className={`flex-1 py-2.5 px-3 rounded-[10px] font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  state.mode === "draw"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-[#F9FAFB] dark:bg-gray-800 text-[#0A0A0A] dark:text-white hover:bg-[#E5E7EB] dark:hover:bg-gray-700"
                }`}
              >
                <BiPencil />
                Draw
              </button>
            </div>

            {/* Detection Settings */}
            <PanelHeading title="Detection" />
            <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Bubble Sensitivity
                </span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                  {state.sensitivity}%
                </span>
              </div>
              <Slider
                min={70}
                max={98}
                value={[state.sensitivity]}
                onValueChange={([v]) => updateState({ sensitivity: v })}
              />
              <p className="text-xs text-gray-400 mt-1">
                Higher = detects lighter bubbles
              </p>
            </div>

            <div className="p-4 border-b border-[#E5E7EB]/60 dark:border-gray-700/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Text Threshold
                </span>
                <span className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                  {state.textThreshold}
                </span>
              </div>
              <Slider
                min={50}
                max={150}
                value={[state.textThreshold]}
                onValueChange={([v]) => updateState({ textThreshold: v })}
              />
              <p className="text-xs text-gray-400 mt-1">
                Lower = only very dark text, Higher = more gray tones
              </p>
            </div>

            <Control title="Re-detect Bubbles" onTap={redetectBubbles}>
              <BiRefresh
                className={`text-xl ${state.isProcessing ? "animate-spin" : ""}`}
              />
            </Control>

            {/* Bubble Selection */}
            <PanelHeading title={`Bubbles (${state.bubbles.length})`} />
            <div className="p-3">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={selectAllBubbles}
                  className="flex-1 py-2 bg-[#F9FAFB] dark:bg-gray-800 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <BiSelectMultiple />
                  Select All
                </button>
                <button
                  onClick={deselectAllBubbles}
                  className="flex-1 py-2 bg-[#F9FAFB] dark:bg-gray-800 hover:bg-[#E5E7EB] dark:hover:bg-gray-700 rounded-[10px] text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <BsX />
                  Deselect
                </button>
              </div>

              {state.bubbles.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No bubbles detected</p>
                  <p className="text-xs mt-1">
                    Try adjusting sensitivity or draw manually
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {state.bubbles.map((bubble, index) => (
                    <BubbleItem
                      key={bubble.id}
                      bubble={bubble}
                      index={index}
                      onToggle={() => {
                        updateState({
                          bubbles: state.bubbles.map((b) =>
                            b.id === bubble.id
                              ? { ...b, isSelected: !b.isSelected }
                              : b
                          ),
                        });
                      }}
                      onDelete={() => deleteBubble(bubble.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <PanelHeading title="Actions" />
            <Control title="Reset to Original" onTap={resetToOriginal}>
              <BsChevronRight className="text-xl" />
            </Control>

            {/* Tips */}
            <PanelHeading title="Tips" />
            <div className="p-4 text-xs text-gray-500 dark:text-gray-400 space-y-2">
              <p className="flex items-center gap-1.5"><BsLightbulb className="shrink-0" /> Click bubbles to select/deselect them</p>
              <p className="flex items-center gap-1.5"><BsPencil className="shrink-0" /> Use Draw mode to manually select regions</p>
              <p className="flex items-center gap-1.5"><BsLightning className="shrink-0" /> Click &quot;BLAST!&quot; to remove text from selected bubbles</p>
              <p className="flex items-center gap-1.5"><BsBullseye className="shrink-0" /> Adjust sensitivity for better detection</p>
            </div>
          </>
        )}

        {!state.image && (
          <div className="p-8 text-center text-gray-400">
            <BsChatSquareDots className="text-2xl mb-2 mx-auto" />
            <p className="text-sm">Upload an image to get started</p>
          </div>
        )}
      </div>
    </section>
  );
};

interface BubbleItemProps {
  bubble: BubbleRegion;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
}

const BubbleItem = ({ bubble, index, onToggle, onDelete }: BubbleItemProps) => {
  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-[10px] border transition-all ${
        bubble.isSelected
          ? bubble.isProcessed
            ? "border-green-300 bg-green-50"
            : "border-[#2563EB]/30 bg-[#2563EB]/5"
          : "border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
            bubble.isSelected
              ? bubble.isProcessed
                ? "bg-green-500 text-white"
                : "bg-[#2563EB] text-white"
              : "bg-[#F9FAFB] dark:bg-gray-800"
          }`}
        >
          {bubble.isSelected && <BsCheck className="text-sm" />}
        </button>
        <div>
          <span className="text-sm font-medium">Bubble {index + 1}</span>
          <span className="text-xs text-gray-400 ml-2">
            {Math.round(bubble.width)}×{Math.round(bubble.height)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {bubble.isProcessed && (
          <span className="text-xs text-green-600 font-medium">✓ Cleaned</span>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
        >
          <BsTrash className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default BubbleBlasterControls;
