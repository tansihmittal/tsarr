import React, { useRef, useState, useEffect, useCallback } from "react";
import { useEditorContext } from "@/context/Editor";

interface Point {
  x: number;
  y: number;
}

interface DrawElement {
  id: string;
  type: string;
  points?: Point[];
  start?: Point;
  end?: Point;
  color: string;
  width: number;
  fillColor: string;
  opacity: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  sloppiness?: number;
  text?: string;
  fontSize?: number;
  seed?: number;
}

// Seeded random for consistent sloppiness
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const {
    annotationElements,
    updateData,
    drawingTool,
    strokeColor,
    strokeWidth,
    fillColor,
    opacity,
    strokeStyle,
    sloppiness,
    selectedElementId,
  } = useEditorContext();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Point>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [textInput, setTextInput] = useState<{
    visible: boolean;
    x: number;
    y: number;
    value: string;
    fontSize: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    value: "",
    fontSize: 24,
  });
  const pathsRef = useRef<DrawElement[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 11);
  const generateSeed = () => Math.floor(Math.random() * 1000000);

  useEffect(() => {
    pathsRef.current = annotationElements || [];
    redrawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotationElements, selectedElementId]);

  // Keyboard shortcuts for tool switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        textInput.visible
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      let newTool: string | null = null;

      switch (key) {
        case "v":
        case "1":
          newTool = "select";
          break;
        case "r":
        case "2":
          newTool = "rectangle";
          break;
        case "o":
        case "3":
          newTool = "ellipse";
          break;
        case "a":
        case "4":
          newTool = "arrow";
          break;
        case "l":
        case "5":
          newTool = "line";
          break;
        case "p":
        case "6":
          newTool = "pen";
          break;
        case "t":
        case "7":
          newTool = "text";
          break;
        case "h":
        case "8":
          newTool = "highlighter";
          break;
        case "b":
        case "9":
          newTool = "blur";
          break;
        case "e":
        case "0":
          newTool = "eraser";
          break;
        case "delete":
        case "backspace":
          // Delete selected element
          if (selectedElementId) {
            pathsRef.current = pathsRef.current.filter(
              (el) => el.id !== selectedElementId
            );
            updateData && updateData("annotationElements", [...pathsRef.current]);
            updateData && updateData("selectedElementId", null);
          }
          break;
        case "escape":
          // Deselect element
          updateData && updateData("selectedElementId", null);
          break;
      }

      if (newTool && updateData) {
        updateData("drawingTool", newTool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [updateData, selectedElementId, textInput.visible]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redrawCanvas();
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLineDash = (
    style?: "solid" | "dashed" | "dotted",
    width: number = 2
  ): number[] => {
    if (style === "dashed") return [width * 4, width * 2];
    if (style === "dotted") return [width, width * 2];
    return [];
  };

  // Consistent sloppiness using seed
  const getSloppyOffset = (
    seed: number,
    index: number,
    sloppiness: number
  ): Point => {
    if (sloppiness === 0) return { x: 0, y: 0 };
    const jitter = sloppiness === 1 ? 2 : 5;
    return {
      x: (seededRandom(seed + index) - 0.5) * jitter,
      y: (seededRandom(seed + index + 1000) - 0.5) * jitter,
    };
  };

  // Draw sloppy line with multiple passes for hand-drawn effect
  const drawSloppyLine = (
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    seed: number,
    sloppiness: number
  ) => {
    if (sloppiness === 0) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      return;
    }

    const passes = sloppiness === 1 ? 1 : 2;
    for (let pass = 0; pass < passes; pass++) {
      ctx.beginPath();
      const segments = 8;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        const offset = getSloppyOffset(seed + pass * 100, i, sloppiness);
        if (i === 0) ctx.moveTo(x + offset.x, y + offset.y);
        else ctx.lineTo(x + offset.x, y + offset.y);
      }
      ctx.stroke();
    }
  };

  // Draw sloppy rectangle
  const drawSloppyRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    seed: number,
    sloppiness: number,
    fill: boolean,
    fillColor: string
  ) => {
    if (sloppiness === 0) {
      if (fill) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeRect(x, y, w, h);
      return;
    }

    ctx.beginPath();
    const corners = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];

    corners.forEach((corner, i) => {
      const offset = getSloppyOffset(seed, i, sloppiness);
      const nextCorner = corners[(i + 1) % 4];
      const nextOffset = getSloppyOffset(seed, (i + 1) % 4, sloppiness);

      if (i === 0) ctx.moveTo(corner.x + offset.x, corner.y + offset.y);

      // Draw slightly curved line between corners
      const midX = (corner.x + nextCorner.x) / 2;
      const midY = (corner.y + nextCorner.y) / 2;
      const midOffset = getSloppyOffset(seed, i + 10, sloppiness);

      ctx.quadraticCurveTo(
        midX + midOffset.x,
        midY + midOffset.y,
        nextCorner.x + nextOffset.x,
        nextCorner.y + nextOffset.y
      );
    });

    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.stroke();
  };

  // Draw sloppy ellipse
  const drawSloppyEllipse = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    seed: number,
    sloppiness: number,
    fill: boolean,
    fillColor: string
  ) => {
    if (sloppiness === 0) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      if (fill) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      const offset = getSloppyOffset(seed, i, sloppiness);
      if (i === 0) ctx.moveTo(x + offset.x, y + offset.y);
      else ctx.lineTo(x + offset.x, y + offset.y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.stroke();
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pathsRef.current.forEach((element) => {
      ctx.save();
      ctx.globalAlpha = (element.opacity || 100) / 100;
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(getLineDash(element.strokeStyle, element.width));

      const isSelected = selectedElementId === element.id;
      const sloppy = element.sloppiness || 0;
      const seed = element.seed || 0;

      if (element.type === "pen" && element.points) {
        ctx.beginPath();
        element.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else {
            // Smooth curve through points
            const prev = element.points![i - 1];
            const midX = (prev.x + point.x) / 2;
            const midY = (prev.y + point.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
          }
        });
        ctx.stroke();
      } else if (element.type === "highlighter" && element.points) {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = element.width * 4;
        ctx.strokeStyle = "#ffeb3b";
        ctx.beginPath();
        element.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (element.type === "line" && element.start && element.end) {
        drawSloppyLine(ctx, element.start, element.end, seed, sloppy);
      } else if (element.type === "arrow" && element.start && element.end) {
        drawSloppyLine(ctx, element.start, element.end, seed, sloppy);
        // Arrow head
        const headLength = 15;
        const angle = Math.atan2(
          element.end.y - element.start.y,
          element.end.x - element.start.x
        );
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(element.end.x, element.end.y);
        ctx.lineTo(
          element.end.x - headLength * Math.cos(angle - Math.PI / 6),
          element.end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(element.end.x, element.end.y);
        ctx.lineTo(
          element.end.x - headLength * Math.cos(angle + Math.PI / 6),
          element.end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (element.type === "rectangle" && element.start && element.end) {
        const x = Math.min(element.start.x, element.end.x);
        const y = Math.min(element.start.y, element.end.y);
        const w = Math.abs(element.end.x - element.start.x);
        const h = Math.abs(element.end.y - element.start.y);
        const hasFill =
          element.fillColor && element.fillColor !== "transparent";
        drawSloppyRect(
          ctx,
          x,
          y,
          w,
          h,
          seed,
          sloppy,
          hasFill || false,
          element.fillColor
        );
      } else if (element.type === "ellipse" && element.start && element.end) {
        const rx = Math.abs(element.end.x - element.start.x) / 2;
        const ry = Math.abs(element.end.y - element.start.y) / 2;
        const cx = element.start.x + (element.end.x - element.start.x) / 2;
        const cy = element.start.y + (element.end.y - element.start.y) / 2;
        const hasFill =
          element.fillColor && element.fillColor !== "transparent";
        drawSloppyEllipse(
          ctx,
          cx,
          cy,
          rx,
          ry,
          seed,
          sloppy,
          hasFill || false,
          element.fillColor
        );
      } else if (element.type === "blur" && element.start && element.end) {
        const x = Math.min(element.start.x, element.end.x);
        const y = Math.min(element.start.y, element.end.y);
        const w = Math.abs(element.end.x - element.start.x);
        const h = Math.abs(element.end.y - element.start.y);

        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(180, 180, 180, 0.8)";
        ctx.fillRect(x, y, w, h);

        // Pixelated effect
        const pixelSize = 10;
        ctx.fillStyle = "rgba(150, 150, 150, 0.4)";
        for (let px = x; px < x + w; px += pixelSize) {
          for (let py = y; py < y + h; py += pixelSize) {
            if (
              (Math.floor(px / pixelSize) + Math.floor(py / pixelSize)) % 2 ===
              0
            ) {
              ctx.fillRect(px, py, pixelSize, pixelSize);
            }
          }
        }

        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
      } else if (element.type === "text" && element.start && element.text) {
        const fontSize = element.fontSize || 24;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = element.color;
        ctx.textBaseline = "top";
        element.text.split("\n").forEach((line, i) => {
          ctx.fillText(
            line,
            element.start!.x,
            element.start!.y + i * (fontSize * 1.3)
          );
        });
      }

      // Selection box
      if (isSelected && element.start && element.end) {
        ctx.restore();
        ctx.save();
        const minX = Math.min(element.start.x, element.end.x);
        const minY = Math.min(element.start.y, element.end.y);
        const maxX = Math.max(element.start.x, element.end.x);
        const maxY = Math.max(element.start.y, element.end.y);

        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(minX - 6, minY - 6, maxX - minX + 12, maxY - minY + 12);
        ctx.setLineDash([]);

        // Resize handles
        [
          { x: minX - 6, y: minY - 6 },
          { x: maxX + 6, y: minY - 6 },
          { x: minX - 6, y: maxY + 6 },
          { x: maxX + 6, y: maxY + 6 },
        ].forEach((h) => {
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#4f46e5";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
      }

      ctx.restore();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementId]);

  const getMousePos = (
    e: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findElementAtPoint = (pos: Point): DrawElement | null => {
    for (let i = pathsRef.current.length - 1; i >= 0; i--) {
      const el = pathsRef.current[i];
      if (el.start && el.end) {
        const minX = Math.min(el.start.x, el.end.x) - 10;
        const maxX = Math.max(el.start.x, el.end.x) + 10;
        const minY = Math.min(el.start.y, el.end.y) - 10;
        const maxY = Math.max(el.start.y, el.end.y) + 10;
        if (
          pos.x >= minX &&
          pos.x <= maxX &&
          pos.y >= minY &&
          pos.y <= maxY
        ) {
          return el;
        }
      }
    }
    return null;
  };

  const getResizeHandle = (pos: Point, element: DrawElement): string | null => {
    if (!element.start || !element.end) return null;
    const minX = Math.min(element.start.x, element.end.x);
    const minY = Math.min(element.start.y, element.end.y);
    const maxX = Math.max(element.start.x, element.end.x);
    const maxY = Math.max(element.start.y, element.end.y);

    const handles = [
      { name: "nw", x: minX - 6, y: minY - 6 },
      { name: "ne", x: maxX + 6, y: minY - 6 },
      { name: "sw", x: minX - 6, y: maxY + 6 },
      { name: "se", x: maxX + 6, y: maxY + 6 },
    ];

    for (const h of handles) {
      if (Math.abs(pos.x - h.x) < 10 && Math.abs(pos.y - h.y) < 10) {
        return h.name;
      }
    }
    return null;
  };

  const handleTextSubmit = () => {
    if (textInput.value.trim()) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      let textWidth = 150;
      let textHeight = textInput.fontSize;

      if (ctx) {
        ctx.font = `${textInput.fontSize}px Inter, sans-serif`;
        const lines = textInput.value.split("\n");
        textWidth = Math.max(
          ...lines.map((l) => ctx.measureText(l).width),
          150
        );
        textHeight = lines.length * textInput.fontSize * 1.3;
      }

      pathsRef.current.push({
        id: generateId(),
        type: "text",
        start: { x: textInput.x, y: textInput.y },
        end: { x: textInput.x + textWidth, y: textInput.y + textHeight },
        text: textInput.value,
        color: strokeColor,
        width: strokeWidth,
        fontSize: textInput.fontSize,
        fillColor: "transparent",
        opacity,
        strokeStyle,
        sloppiness,
        seed: generateSeed(),
      });
      updateData && updateData("annotationElements", [...pathsRef.current]);
    }
    setTextInput({ visible: false, x: 0, y: 0, value: "", fontSize: 24 });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (textInput.visible) return;

    const pos = getMousePos(e);

    // Check resize handle
    if (selectedElementId) {
      const element = pathsRef.current.find(
        (el) => el.id === selectedElementId
      );
      if (element) {
        const handle = getResizeHandle(pos, element);
        if (handle) {
          setResizeHandle(handle);
          setIsResizing(true);
          setStartPos(pos);
          return;
        }
      }
    }

    if (drawingTool === "select") {
      const element = findElementAtPoint(pos);
      if (element) {
        updateData && updateData("selectedElementId", element.id);
        setDragOffset({
          x: pos.x - (element.start?.x || 0),
          y: pos.y - (element.start?.y || 0),
        });
        setIsDrawing(true);
      } else {
        updateData && updateData("selectedElementId", null);
      }
      redrawCanvas();
      return;
    }

    if (drawingTool === "eraser") {
      const element = findElementAtPoint(pos);
      if (element) {
        pathsRef.current = pathsRef.current.filter(
          (el) => el.id !== element.id
        );
        updateData && updateData("annotationElements", [...pathsRef.current]);
      }
      return;
    }

    if (drawingTool === "text") {
      setTextInput({
        visible: true,
        x: pos.x,
        y: pos.y,
        value: "",
        fontSize: Math.max(18, strokeWidth * 8),
      });
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);

    if (drawingTool === "pen" || drawingTool === "highlighter") {
      pathsRef.current.push({
        id: generateId(),
        type: drawingTool,
        points: [pos],
        color: strokeColor,
        width: strokeWidth,
        fillColor,
        opacity,
        strokeStyle,
        sloppiness,
        seed: generateSeed(),
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    // Handle resize
    if (isResizing && selectedElementId && resizeHandle) {
      const element = pathsRef.current.find(
        (el) => el.id === selectedElementId
      );
      if (element && element.start && element.end) {
        if (resizeHandle === "se") element.end = pos;
        else if (resizeHandle === "nw") element.start = pos;
        else if (resizeHandle === "ne") {
          element.start = { x: element.start.x, y: pos.y };
          element.end = { x: pos.x, y: element.end.y };
        } else if (resizeHandle === "sw") {
          element.start = { x: pos.x, y: element.start.y };
          element.end = { x: element.end.x, y: pos.y };
        }
        redrawCanvas();
      }
      return;
    }

    if (!isDrawing) return;

    if (drawingTool === "select" && selectedElementId) {
      const element = pathsRef.current.find(
        (el) => el.id === selectedElementId
      );
      if (element && element.start && element.end) {
        const width = element.end.x - element.start.x;
        const height = element.end.y - element.start.y;
        element.start = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        element.end = {
          x: element.start.x + width,
          y: element.start.y + height,
        };
        redrawCanvas();
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (drawingTool === "pen" || drawingTool === "highlighter") {
      const currentPath = pathsRef.current[pathsRef.current.length - 1];
      if (currentPath && currentPath.points) {
        currentPath.points.push(pos);
        redrawCanvas();
      }
    } else {
      // Preview shape while drawing
      redrawCanvas();
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(getLineDash(strokeStyle, strokeWidth));

      if (drawingTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (drawingTool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        const headLength = 15;
        const angle = Math.atan2(pos.y - startPos.y, pos.x - startPos.x);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
          pos.x - headLength * Math.cos(angle - Math.PI / 6),
          pos.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
          pos.x - headLength * Math.cos(angle + Math.PI / 6),
          pos.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (drawingTool === "rectangle") {
        if (fillColor !== "transparent") {
          ctx.fillStyle = fillColor;
          ctx.fillRect(
            startPos.x,
            startPos.y,
            pos.x - startPos.x,
            pos.y - startPos.y
          );
        }
        ctx.strokeRect(
          startPos.x,
          startPos.y,
          pos.x - startPos.x,
          pos.y - startPos.y
        );
      } else if (drawingTool === "blur") {
        const x = Math.min(startPos.x, pos.x);
        const y = Math.min(startPos.y, pos.y);
        const w = Math.abs(pos.x - startPos.x);
        const h = Math.abs(pos.y - startPos.y);
        ctx.fillStyle = "rgba(180, 180, 180, 0.8)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
      } else if (drawingTool === "ellipse") {
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        const cx = startPos.x + (pos.x - startPos.x) / 2;
        const cy = startPos.y + (pos.y - startPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (fillColor !== "transparent") {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      updateData && updateData("annotationElements", [...pathsRef.current]);
      return;
    }

    if (!isDrawing) return;
    const pos = getMousePos(e);

    if (drawingTool === "select") {
      setIsDrawing(false);
      updateData && updateData("annotationElements", [...pathsRef.current]);
      return;
    }

    if (
      drawingTool !== "pen" &&
      drawingTool !== "highlighter" &&
      drawingTool !== "eraser" &&
      drawingTool !== "text"
    ) {
      pathsRef.current.push({
        id: generateId(),
        type: drawingTool,
        start: startPos,
        end: pos,
        color: strokeColor,
        width: strokeWidth,
        fillColor,
        opacity,
        strokeStyle,
        sloppiness,
        seed: generateSeed(),
      });
    }

    setIsDrawing(false);
    updateData && updateData("annotationElements", [...pathsRef.current]);
  };

  const getCursor = () => {
    if (isResizing) {
      if (resizeHandle === "nw" || resizeHandle === "se") return "nwse-resize";
      if (resizeHandle === "ne" || resizeHandle === "sw") return "nesw-resize";
    }
    switch (drawingTool) {
      case "select":
        return "default";
      case "eraser":
        return "not-allowed";
      case "text":
        return "text";
      default:
        return "crosshair";
    }
  };

  // Handle cursor change on mouse move for resize handles
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    // Check if hovering over resize handle
    if (selectedElementId && drawingTool === "select") {
      const element = pathsRef.current.find(el => el.id === selectedElementId);
      if (element) {
        const handle = getResizeHandle(pos, element);
        if (handle) {
          const canvas = canvasRef.current;
          if (canvas) {
            if (handle === "nw" || handle === "se") {
              canvas.style.cursor = "nwse-resize";
            } else if (handle === "ne" || handle === "sw") {
              canvas.style.cursor = "nesw-resize";
            }
          }
          draw(e);
          return;
        }
        
        // Check if hovering over the element (for move cursor)
        const foundElement = findElementAtPoint(pos);
        if (foundElement && foundElement.id === selectedElementId) {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.cursor = "move";
          }
          draw(e);
          return;
        }
      }
    }
    
    // Reset to default cursor
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = getCursor();
    }
    
    draw(e);
  };

  // Allow pointer events to pass through when select tool is active and not interacting
  const shouldCaptureEvents = drawingTool !== "select" || isDrawing || isResizing || selectedElementId;

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-30"
      style={{ pointerEvents: shouldCaptureEvents ? "auto" : "none" }}
    >
      <canvas
        ref={canvasRef}
        style={{ cursor: getCursor(), pointerEvents: "auto" }}
        className="w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      {/* Text input modal */}
      {textInput.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTextInput({ ...textInput, visible: false });
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-5 min-w-[320px] max-w-[500px]">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Font Size
              </label>
              <input
                type="range"
                min="14"
                max="72"
                value={textInput.fontSize}
                onChange={(e) =>
                  setTextInput({
                    ...textInput,
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>14px</span>
                <span className="font-medium">{textInput.fontSize}px</span>
                <span>72px</span>
              </div>
            </div>
            <textarea
              ref={textInputRef}
              value={textInput.value}
              onChange={(e) =>
                setTextInput({ ...textInput, value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTextInput({ ...textInput, visible: false });
                }
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              style={{
                color: strokeColor,
                fontSize: `${Math.min(textInput.fontSize, 32)}px`,
              }}
              className="w-full border-2 border-gray-200 rounded-lg p-3 min-h-[100px] resize-none focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="Type your text here..."
              autoFocus
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-gray-400">
                Ctrl+Enter to save, Esc to cancel
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setTextInput({ ...textInput, visible: false })
                  }
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTextSubmit}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;
