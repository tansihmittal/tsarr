import { RefObject, ReactNode } from "react";
import {
  BsChevronRight,
  BsCheck,
  BsX,
  BsTrash,
  BsLightning,
} from "react-icons/bs";
import { BiRefresh, BiSelectMultiple, BiPointer, BiPencil } from "react-icons/bi";
import { BubbleBlasterState, BubbleRegion } from "./BubbleBlasterLayout";

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

const Control = ({
  title,
  value,
  children,
  onTap,
}: {
  title: string;
  value?: string | number | null;
  children: ReactNode;
  onTap?: () => void;
}) => (
  <div
    className="control-item flex justify-between items-center p-[1rem] border-b border-base-200/60 cursor-pointer overflow-hidden group"
    onClick={onTap}
  >
    <div className="flex justify-between items-center gap-2 shrink-0">
      <span className="text-primary-content font-medium">{title}</span>
      {value != null && (
        <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          {value}
        </span>
      )}
    </div>
    <div className="flex items-center overflow-hidden">{children}</div>
  </div>
);

const PanelHeading = ({ title }: { title: string }) => (
  <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
    <span className="w-1 h-4 bg-primary rounded-full"></span>
    {title}
  </h2>
);

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
          className={`w-full py-4 mb-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            unprocessedSelected > 0 && !state.isProcessing
              ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02]"
              : "bg-base-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <BsLightning className="text-xl" />
          BLAST! ({unprocessedSelected} bubbles)
        </button>
      )}

      <div className="rounded-xl border border-base-200/80 bg-base-100 shadow-sm lg:h-[calc(100vh-200px)] lg:overflow-y-scroll scrollbar-hide">
        {state.image && (
          <>
            {/* Mode Selection */}
            <PanelHeading title="Mode" />
            <div className="p-3 flex gap-2">
              <button
                onClick={() => updateState({ mode: "select" })}
                className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  state.mode === "select"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-base-200 text-primary-content hover:bg-base-300"
                }`}
              >
                <BiPointer />
                Select
              </button>
              <button
                onClick={() => updateState({ mode: "draw" })}
                className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  state.mode === "draw"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-base-200 text-primary-content hover:bg-base-300"
                }`}
              >
                <BiPencil />
                Draw
              </button>
            </div>

            {/* Detection Settings */}
            <PanelHeading title="Detection" />
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">
                  Bubble Sensitivity
                </span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.sensitivity}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={state.sensitivity}
                onChange={(e) =>
                  updateState({ sensitivity: parseInt(e.target.value) })
                }
                className="range range-xs range-primary w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Higher = detects lighter bubbles
              </p>
            </div>
            
            <div className="p-4 border-b border-base-200/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 font-medium">
                  Text Threshold
                </span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {state.textThreshold}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={state.textThreshold}
                onChange={(e) =>
                  updateState({ textThreshold: parseInt(e.target.value) })
                }
                className="range range-xs range-primary w-full"
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
                  className="flex-1 py-2 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <BiSelectMultiple />
                  Select All
                </button>
                <button
                  onClick={deselectAllBubbles}
                  className="flex-1 py-2 bg-base-200 hover:bg-base-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
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
            <div className="p-4 text-xs text-gray-500 space-y-2">
              <p>💡 Click bubbles to select/deselect them</p>
              <p>✏️ Use Draw mode to manually select regions</p>
              <p>⚡ Click &quot;BLAST!&quot; to remove text from selected bubbles</p>
              <p>🎯 Adjust sensitivity for better detection</p>
            </div>
          </>
        )}

        {!state.image && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">💬</p>
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
      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
        bubble.isSelected
          ? bubble.isProcessed
            ? "border-green-300 bg-green-50"
            : "border-primary/30 bg-primary/5"
          : "border-base-200 bg-base-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
            bubble.isSelected
              ? bubble.isProcessed
                ? "bg-green-500 text-white"
                : "bg-primary text-white"
              : "bg-base-200"
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
