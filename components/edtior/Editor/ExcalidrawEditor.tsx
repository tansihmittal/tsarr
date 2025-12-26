import dynamic from "next/dynamic";
import React, { useEffect, useState, useRef } from "react";
import { useEditorContext } from "@/context/Editor";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

const ExcalidrawEditor: React.FC = () => {
  const { annotationElements, updateData } = useEditorContext();
  const [isClient, setIsClient] = useState(false);
  const lastElementsRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (elements: readonly any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const elementsJson = JSON.stringify(elements);
      if (elementsJson !== lastElementsRef.current && elements.length > 0) {
        lastElementsRef.current = elementsJson;
        updateData && updateData("annotationElements", [...elements]);
      }
    }, 100);
  };

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Excalidraw
        initialData={{
          elements: annotationElements || [],
          appState: {
            viewBackgroundColor: "transparent",
            currentItemStrokeColor: "#e03131",
            currentItemBackgroundColor: "transparent",
            currentItemStrokeWidth: 2,
          },
        }}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            saveAsImage: false,
          },
        }}
      />
      <style jsx global>{`
        .excalidraw {
          background-color: transparent !important;
          height: 100% !important;
          width: 100% !important;
        }
        .excalidraw-container {
          background-color: transparent !important;
          height: 100% !important;
          width: 100% !important;
        }
        .excalidraw .layer-ui__wrapper {
          pointer-events: auto !important;
        }
        .excalidraw .Island {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ExcalidrawEditor;
