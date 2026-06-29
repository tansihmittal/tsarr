import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Shape, ImapDocument, ShapeType } from "./types";
import { TOOL_FONT, pinGeometry, pinPath, getActiveArtboard } from "./types";

export type Tool =
  | "select"
  | "rect"
  | "ellipse"
  | "polygon"
  | "image"
  | "text"
  | "pin";

interface Props {
  doc: ImapDocument;
  tool: Tool;
  selectedId: string | null;
  preview: boolean;
  pendingImageHref: string | null;
  onCommit: (shape: Shape, type: ShapeType) => void;
  onUpdate: (id: string, patch: Partial<Shape>, recordHistory?: boolean) => void;
  onSelect: (id: string | null) => void;
  onEditText: (id: string) => void;
}

type Pt = { x: number; y: number };
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type HandleId = (typeof HANDLES)[number];

let drawSeq = 0;

const ImapCanvas: React.FC<Props> = ({
  doc,
  tool,
  selectedId,
  preview,
  pendingImageHref,
  onCommit,
  onUpdate,
  onSelect,
  onEditText,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);

  const ab = getActiveArtboard(doc);
  const W = ab.bgWidth || 1000;
  const H = ab.bgHeight || 1000;

  // ---- screen <-> image coordinate conversion ----
  const toImg = useCallback(
    (clientX: number, clientY: number): Pt => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const r = svg.getBoundingClientRect();
      const s = Math.min(r.width / W, r.height / H) || 1;
      const dispW = W * s;
      const dispH = H * s;
      const offX = (r.width - dispW) / 2;
      const offY = (r.height - dispH) / 2;
      return {
        x: (clientX - r.left - offX) / s,
        y: (clientY - r.top - offY) / s,
      };
    },
    [W, H]
  );

  // keep `scale` in sync so handles render at a constant pixel size
  useLayoutEffect(() => {
    const update = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      setScale(Math.min(r.width / W, r.height / H) || 1);
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [W, H]);

  // ---- in-progress drawing state ----
  const draft = useRef<{
    type: ShapeType;
    start: Pt;
    cur: Pt;
  } | null>(null);
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  const [polyPoints, setPolyPoints] = useState<Pt[]>([]);
  const [polyCursor, setPolyCursor] = useState<Pt | null>(null);

  // live tooltip shown while previewing (positioned relative to the wrapper)
  const [tip, setTip] = useState<{
    left: number;
    top: number;
    transform: string;
    title?: string;
    description?: string;
  } | null>(null);
  const stickyId = useRef<string | null>(null);

  // preview zoom & pan (CSS transform on the svg, screen-space like the embed)
  const [view, setView] = useState({ z: 1, px: 0, py: 0 });
  const zoomEnabled = preview && !!doc.options?.zoom;
  const maxZoom = doc.options?.maxZoom || 4;
  const panDrag = useRef<{ sx: number; sy: number } | null>(null);

  const clampView = (v: { z: number; px: number; py: number }) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return v;
    const minX = r.width - r.width * v.z;
    const minY = r.height - r.height * v.z;
    return {
      z: v.z,
      px: Math.min(0, Math.max(minX, v.px)),
      py: Math.min(0, Math.max(minY, v.py)),
    };
  };
  const zoomAt = (factor: number, ox: number, oy: number) => {
    setView((v) => {
      const nz = Math.min(maxZoom, Math.max(1, v.z * factor));
      const k = nz / v.z;
      return clampView({ z: nz, px: ox - (ox - v.px) * k, py: oy - (oy - v.py) * k });
    });
  };
  const onPreviewWheel = (e: React.WheelEvent) => {
    if (!zoomEnabled) return;
    e.preventDefault();
    const r = wrapRef.current!.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.12 : 0.9, e.clientX - r.left, e.clientY - r.top);
  };
  const onPreviewPanDown = (e: React.PointerEvent) => {
    if (!zoomEnabled) return;
    panDrag.current = { sx: e.clientX - view.px, sy: e.clientY - view.py };
  };
  const onPreviewPanMove = (e: React.PointerEvent) => {
    if (!zoomEnabled || !panDrag.current) return;
    setView((v) =>
      clampView({ z: v.z, px: e.clientX - panDrag.current!.sx, py: e.clientY - panDrag.current!.sy })
    );
  };
  const onPreviewPanUp = () => {
    panDrag.current = null;
  };

  const placeTip = (el: Element, s: Shape, e?: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return null;
    const pos = s.tooltipPosition || "auto";
    if (pos === "auto" && e) {
      return {
        left: e.clientX - r.left,
        top: e.clientY - r.top,
        transform: "translate(-50%, calc(-100% - 10px))",
        title: s.title,
        description: s.description,
      };
    }
    const b = el.getBoundingClientRect();
    const cx = b.left - r.left + b.width / 2;
    const cy = b.top - r.top + b.height / 2;
    const p = pos === "auto" ? "top" : pos;
    const map: Record<string, { left: number; top: number; transform: string }> = {
      top: { left: cx, top: b.top - r.top, transform: "translate(-50%, calc(-100% - 10px))" },
      bottom: { left: cx, top: b.bottom - r.top, transform: "translate(-50%, 10px)" },
      left: { left: b.left - r.left, top: cy, transform: "translate(calc(-100% - 10px), -50%)" },
      right: { left: b.right - r.left, top: cy, transform: "translate(10px, -50%)" },
    };
    return { ...map[p], title: s.title, description: s.description };
  };

  const showTip = (e: React.MouseEvent, s: Shape) => {
    if (!preview || stickyId.current) return;
    if (!s.title && !s.description) return;
    if (s.action === "none") return;
    const placed = placeTip(e.currentTarget as Element, s, e);
    if (placed) setTip(placed);
  };

  const toggleSticky = (e: React.MouseEvent, s: Shape) => {
    if (!preview) return;
    if (!s.title && !s.description) return;
    e.stopPropagation();
    if (stickyId.current === s.id) {
      stickyId.current = null;
      setTip(null);
    } else {
      stickyId.current = s.id;
      const placed = placeTip(e.currentTarget as Element, s, e);
      if (placed) setTip(placed);
    }
  };

  // ---- drag (move / resize / vertex) ----
  const drag = useRef<{
    mode: "move" | "resize" | "vertex";
    handle?: HandleId;
    vertexIdx?: number;
    start: Pt;
    orig: Shape;
    group?: Shape[]; // originals of all group members (move as a unit)
  } | null>(null);

  const selected = ab.shapes.find((s) => s.id === selectedId) || null;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  // ---------- pointer handlers ----------
  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (preview) return;
    if (e.button !== 0) return;
    const p = toImg(e.clientX, e.clientY);

    if (tool === "polygon") {
      // click to add vertex; close when near the first point
      if (polyPoints.length >= 3) {
        const first = polyPoints[0];
        const near =
          Math.hypot(first.x - p.x, first.y - p.y) < 12 / scale;
        if (near) {
          finishPolygon();
          return;
        }
      }
      setPolyPoints((prev) => [...prev, p]);
      return;
    }

    if (tool === "text") {
      const fs = 28;
      onCommit(
        {
          x: clamp(p.x, 0, W),
          y: clamp(p.y, 0, H),
          width: 240,
          height: fs * 1.3,
        } as Shape,
        "text"
      );
      return;
    }

    if (tool === "pin") {
      // Click-to-place; the layout anchors the tip at the click point.
      onCommit({ x: clamp(p.x, 0, W), y: clamp(p.y, 0, H) } as Shape, "pin");
      return;
    }

    if (tool === "rect" || tool === "ellipse" || tool === "image") {
      draft.current = { type: tool, start: p, cur: p };
      drawSeq += 1;
      window.addEventListener("pointermove", onDrawMove);
      window.addEventListener("pointerup", onDrawUp);
      return;
    }

    // select tool on empty canvas → deselect
    onSelect(null);
  };

  const onDrawMove = (e: PointerEvent) => {
    if (!draft.current) return;
    draft.current.cur = toImg(e.clientX, e.clientY);
    rerender();
  };

  const onDrawUp = (e: PointerEvent) => {
    window.removeEventListener("pointermove", onDrawMove);
    window.removeEventListener("pointerup", onDrawUp);
    const d = draft.current;
    draft.current = null;
    if (!d) return;
    const end = toImg(e.clientX, e.clientY);
    let x = Math.min(d.start.x, end.x);
    let y = Math.min(d.start.y, end.y);
    let w = Math.abs(end.x - d.start.x);
    let h = Math.abs(end.y - d.start.y);
    // a click without a drag → reasonable default box
    if (w < 6 || h < 6) {
      w = d.type === "image" ? 180 : 120;
      h = d.type === "image" ? 180 : 90;
    }
    x = clamp(x, 0, Math.max(0, W - w));
    y = clamp(y, 0, Math.max(0, H - h));
    onCommit({ x, y, width: w, height: h } as Shape, d.type);
    rerender();
  };

  const finishPolygon = useCallback(() => {
    if (polyPoints.length >= 3) {
      onCommit({ x: 0, y: 0, width: 0, height: 0, points: polyPoints } as Shape, "polygon");
    }
    setPolyPoints([]);
    setPolyCursor(null);
  }, [polyPoints, onCommit]);

  // Clear any in-progress polygon whenever we leave the polygon tool.
  // Functional updates return the SAME reference when already empty, so React
  // bails out instead of re-rendering — no update loop.
  useEffect(() => {
    if (tool !== "polygon") {
      setPolyPoints((p) => (p.length ? [] : p));
      setPolyCursor((c) => (c ? null : c));
    }
  }, [tool]);

  // Esc cancels an in-progress polygon; Enter finishes it.
  useEffect(() => {
    if (tool !== "polygon") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPolyPoints([]);
        setPolyCursor(null);
      } else if (e.key === "Enter") {
        finishPolygon();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, finishPolygon]);

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (tool === "polygon" && polyPoints.length > 0) {
      setPolyCursor(toImg(e.clientX, e.clientY));
    }
  };

  // ---- shape interactions (move) ----
  const startMove = (e: React.PointerEvent, s: Shape) => {
    if (preview) return;
    e.stopPropagation();
    if (tool !== "select") return;
    onSelect(s.id);
    const group = s.groupId
      ? ab.shapes
          .filter((x) => x.groupId === s.groupId)
          .map((x) => JSON.parse(JSON.stringify(x)) as Shape)
      : undefined;
    drag.current = {
      mode: "move",
      start: toImg(e.clientX, e.clientY),
      orig: JSON.parse(JSON.stringify(s)),
      group,
    };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragUp);
  };

  const startResize = (e: React.PointerEvent, s: Shape, handle: HandleId) => {
    e.stopPropagation();
    drag.current = {
      mode: "resize",
      handle,
      start: toImg(e.clientX, e.clientY),
      orig: JSON.parse(JSON.stringify(s)),
    };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragUp);
  };

  const startVertex = (e: React.PointerEvent, s: Shape, idx: number) => {
    e.stopPropagation();
    drag.current = {
      mode: "vertex",
      vertexIdx: idx,
      start: toImg(e.clientX, e.clientY),
      orig: JSON.parse(JSON.stringify(s)),
    };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragUp);
  };

  const onDragMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toImg(e.clientX, e.clientY);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    const o = d.orig;

    if (d.mode === "move") {
      // Move the whole group together if this shape belongs to one.
      const members = d.group && d.group.length > 1 ? d.group : [o];
      for (const m of members) {
        if (m.type === "polygon" && m.points) {
          onUpdate(m.id, { points: m.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) }, false);
        } else {
          onUpdate(
            m.id,
            {
              x: clamp(m.x + dx, -m.width / 2, W - m.width / 2),
              y: clamp(m.y + dy, -m.height / 2, H - m.height / 2),
            },
            false
          );
        }
      }
    } else if (d.mode === "vertex" && o.points && d.vertexIdx != null) {
      const pts = o.points.map((pt, i) =>
        i === d.vertexIdx ? { x: pt.x + dx, y: pt.y + dy } : pt
      );
      onUpdate(o.id, { points: pts }, false);
    } else if (d.mode === "resize" && d.handle) {
      let { x, y, width, height } = o;
      const right = x + width;
      const bottom = y + height;
      const h = d.handle;
      if (h.includes("w")) {
        x = o.x + dx;
        width = right - x;
      }
      if (h.includes("n")) {
        y = o.y + dy;
        height = bottom - y;
      }
      if (h.includes("e")) width = o.width + dx;
      if (h.includes("s")) height = o.height + dy;
      // prevent inversion
      if (width < 8) width = 8;
      if (height < 8) height = 8;
      onUpdate(o.id, { x, y, width, height }, false);
    }
  };

  const onDragUp = () => {
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragUp);
    const d = drag.current;
    drag.current = null;
    if (d) {
      // commit a history entry for the final position
      const cur = ab.shapes.find((s) => s.id === d.orig.id);
      if (cur) onUpdate(cur.id, {}, true);
    }
  };

  // ---------- rendering ----------
  // CSS custom props that drive the hover state (matches the exported SVG).
  const hoverVars = (s: Shape): React.CSSProperties => {
    const v: any = {};
    if (s.hoverFill) v["--hf"] = s.hoverFill;
    if (s.hoverFillOpacity != null) v["--hfo"] = s.hoverFillOpacity;
    if (s.hoverStroke) v["--hs"] = s.hoverStroke;
    if (s.hoverStrokeWidth != null) v["--hsw"] = s.hoverStrokeWidth;
    if (s.hoverOpacity != null) v["--ho"] = s.hoverOpacity;
    if (s.hoverScale != null) v["--hsc"] = s.hoverScale;
    if (s.animation === "glow") v["--gc"] = s.stroke || s.fill;
    return v;
  };

  const animClass = (s: Shape) =>
    preview && s.animation && s.animation !== "none"
      ? ` imap-anim-${s.animation}`
      : "";

  // hide any open tooltip when leaving preview mode
  useEffect(() => {
    if (!preview) {
      stickyId.current = null;
      setTip(null);
      setView({ z: 1, px: 0, py: 0 });
    }
  }, [preview]);

  const renderShapeBody = (s: Shape, interactive: boolean) => {
    const commonProps: any = {
      fill: s.fill,
      fillOpacity: s.fillOpacity,
      stroke: s.stroke,
      strokeWidth: s.strokeWidth,
      strokeOpacity: s.strokeOpacity ?? 1,
      strokeDasharray: s.strokeDasharray || undefined,
      opacity: s.opacity,
      filter: s.shadow ? "url(#imap-shadow)" : undefined,
    };
    const interactiveProps = interactive
      ? {
          style: { cursor: tool === "select" ? "move" : "crosshair" },
          onPointerDown: (e: React.PointerEvent) => startMove(e, s),
          onDoubleClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            if (s.type === "text") onEditText(s.id);
          },
        }
      : {};
    const isClickTip =
      (s.tooltipTrigger || "hover") === "click" && (s.title || s.description);
    const previewProps = preview
      ? {
          className: `imap-spot${animClass(s)}`,
          style: hoverVars(s),
          onMouseMove: isClickTip ? undefined : (e: React.MouseEvent) => showTip(e, s),
          onMouseLeave: isClickTip ? undefined : () => { if (!stickyId.current) setTip(null); },
          onClick: isClickTip ? (e: React.MouseEvent) => toggleSticky(e, s) : undefined,
        }
      : {};

    switch (s.type) {
      case "rect":
        return (
          <rect data-id={s.id} x={s.x} y={s.y} width={s.width} height={s.height}
            rx={s.cornerRadius ?? 0} {...commonProps} {...interactiveProps} {...previewProps} />
        );
      case "ellipse":
        return (
          <ellipse data-id={s.id} cx={s.x + s.width / 2} cy={s.y + s.height / 2}
            rx={s.width / 2} ry={s.height / 2} {...commonProps} {...interactiveProps} {...previewProps} />
        );
      case "polygon":
        return (
          <polygon data-id={s.id} points={(s.points || []).map((p) => `${p.x},${p.y}`).join(" ")}
            {...commonProps} {...interactiveProps} {...previewProps} />
        );
      case "image":
        return (
          <image data-id={s.id} x={s.x} y={s.y} width={s.width} height={s.height}
            href={s.href} opacity={s.opacity} filter={s.shadow ? "url(#imap-shadow)" : undefined}
            preserveAspectRatio="xMidYMid meet" {...interactiveProps} {...previewProps} />
        );
      case "text": {
        const anchor = s.textAlign || "start";
        const tx = anchor === "middle" ? s.x + s.width / 2 : anchor === "end" ? s.x + s.width : s.x;
        return (
          <text data-id={s.id} x={tx} y={s.y + (s.fontSize || 28)}
            fontFamily={s.fontFamily || TOOL_FONT} fontSize={s.fontSize || 28}
            fill={s.fill} fillOpacity={s.fillOpacity} opacity={s.opacity} textAnchor={anchor}
            style={{ userSelect: "none", ...(preview ? hoverVars(s) : {}) }}
            {...interactiveProps} {...previewProps}>
            {s.text}
          </text>
        );
      }
      case "pin": {
        const g = pinGeometry(s);
        return (
          <g data-id={s.id} opacity={s.opacity}
            filter={s.shadow ? "url(#imap-shadow)" : undefined}
            {...interactiveProps} {...previewProps}>
            <path d={pinPath(s)} fill={s.pinColor || s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
            {s.pinLabel ? (
              <text x={g.cx} y={g.cy} fontFamily={TOOL_FONT} fontSize={g.r * 0.95}
                fontWeight={600} fill={s.pinTextColor || "#fff"} textAnchor="middle"
                dominantBaseline="central" style={{ pointerEvents: "none", userSelect: "none" }}>
                {s.pinLabel}
              </text>
            ) : null}
          </g>
        );
      }
      default:
        return null;
    }
  };

  const renderShape = (s: Shape) => {
    const body = renderShapeBody(s, !preview);
    const isLink = preview && s.action !== "none" && s.action !== "tooltip" && s.link;
    if (isLink) {
      return (
        <a key={s.id} href={s.link} target={s.linkTarget || "_blank"} rel="noopener noreferrer">
          {s.title ? <title>{s.title}</title> : null}
          {body}
        </a>
      );
    }
    return (
      <g key={s.id}>
        {s.title ? <title>{s.title}</title> : null}
        {body}
      </g>
    );
  };

  // selection overlay
  const renderSelection = () => {
    if (!selected || preview) return null;
    const hs = 9 / scale;
    const sw = 1.5 / scale;

    if (selected.type === "polygon" && selected.points) {
      return (
        <g pointerEvents="all">
          <polygon
            points={selected.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#2563EB"
            strokeWidth={sw}
            strokeDasharray={`${4 / scale} ${3 / scale}`}
          />
          {selected.points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hs / 1.6}
              fill="#fff"
              stroke="#2563EB"
              strokeWidth={sw}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => startVertex(e, selected, i)}
            />
          ))}
        </g>
      );
    }

    const { x, y, width, height } = selected;
    const pos: Record<HandleId, Pt> = {
      nw: { x, y },
      n: { x: x + width / 2, y },
      ne: { x: x + width, y },
      e: { x: x + width, y: y + height / 2 },
      se: { x: x + width, y: y + height },
      s: { x: x + width / 2, y: y + height },
      sw: { x, y: y + height },
      w: { x, y: y + height / 2 },
    };
    const cursors: Record<HandleId, string> = {
      nw: "nwse-resize",
      n: "ns-resize",
      ne: "nesw-resize",
      e: "ew-resize",
      se: "nwse-resize",
      s: "ns-resize",
      sw: "nesw-resize",
      w: "ew-resize",
    };
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="#2563EB"
          strokeWidth={sw}
          strokeDasharray={`${4 / scale} ${3 / scale}`}
          pointerEvents="none"
        />
        {HANDLES.map((hid) => (
          <rect
            key={hid}
            x={pos[hid].x - hs / 2}
            y={pos[hid].y - hs / 2}
            width={hs}
            height={hs}
            fill="#fff"
            stroke="#2563EB"
            strokeWidth={sw}
            rx={hs / 4}
            style={{ cursor: cursors[hid] }}
            onPointerDown={(e) => startResize(e, selected, hid)}
          />
        ))}
      </g>
    );
  };

  // draft (rubber-band) shape while drawing
  const renderDraft = () => {
    const d = draft.current;
    if (!d) return null;
    const x = Math.min(d.start.x, d.cur.x);
    const y = Math.min(d.start.y, d.cur.y);
    const w = Math.abs(d.cur.x - d.start.x);
    const h = Math.abs(d.cur.y - d.start.y);
    if (d.type === "ellipse") {
      return (
        <ellipse
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          fill="#2563EB"
          fillOpacity={0.18}
          stroke="#2563EB"
          strokeWidth={1.5 / scale}
        />
      );
    }
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#2563EB"
        fillOpacity={0.18}
        stroke="#2563EB"
        strokeWidth={1.5 / scale}
        strokeDasharray={`${4 / scale} ${3 / scale}`}
      />
    );
  };

  const renderPolyDraft = () => {
    if (tool !== "polygon" || polyPoints.length === 0) return null;
    const pts = polyCursor ? [...polyPoints, polyCursor] : polyPoints;
    return (
      <g pointerEvents="none">
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#2563EB"
          fillOpacity={0.12}
          stroke="#2563EB"
          strokeWidth={1.5 / scale}
        />
        {polyPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={(i === 0 ? 7 : 5) / scale}
            fill={i === 0 ? "#2563EB" : "#fff"}
            stroke="#2563EB"
            strokeWidth={1.5 / scale}
          />
        ))}
      </g>
    );
  };

  const cursor =
    preview || tool === "select"
      ? "default"
      : tool === "polygon"
      ? "crosshair"
      : "crosshair";

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full flex items-center justify-center"
      style={zoomEnabled ? { overflow: "hidden" } : undefined}
      onWheel={onPreviewWheel}
      onClick={() => {
        // click on empty preview area closes a sticky tooltip
        if (preview && stickyId.current) {
          stickyId.current = null;
          setTip(null);
        }
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{
          cursor: zoomEnabled ? (panDrag.current ? "grabbing" : "grab") : cursor,
          touchAction: "none",
          ...(zoomEnabled
            ? {
                transform: `translate(${view.px}px, ${view.py}px) scale(${view.z})`,
                transformOrigin: "0 0",
              }
            : {}),
        }}
        onPointerDown={(e) => {
          onPreviewPanDown(e);
          onCanvasPointerDown(e);
        }}
        onPointerMove={(e) => {
          onPreviewPanMove(e);
          onCanvasPointerMove(e);
        }}
        onPointerUp={onPreviewPanUp}
        onDoubleClick={() => {
          if (tool === "polygon") finishPolygon();
        }}
      >
        <defs>
          <filter id="imap-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
          </filter>
        </defs>
        {preview && (
          <style>{`
            .imap-spot{transition:fill .15s,fill-opacity .15s,stroke .15s,stroke-width .15s,opacity .15s,transform .15s;transform-box:fill-box;transform-origin:center}
            .imap-spot:hover{fill:var(--hf,inherit);fill-opacity:var(--hfo,inherit);stroke:var(--hs,inherit);stroke-width:var(--hsw,inherit);opacity:var(--ho,inherit);transform:scale(var(--hsc,1))}
            @keyframes imap-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
            .imap-anim-pulse{animation:imap-pulse 1.6s ease-in-out infinite}
            @keyframes imap-glow{0%,100%{filter:drop-shadow(0 0 0 var(--gc,#2563EB))}50%{filter:drop-shadow(0 0 7px var(--gc,#2563EB))}}
            .imap-anim-glow{animation:imap-glow 1.8s ease-in-out infinite}
            ${doc.options?.highlightOnHover ? "svg:hover .imap-spot:not(:hover){opacity:.35}" : ""}
            ${
              doc.options?.glowAll
                ? `.imap-spot{--gc:${doc.options.glowColor || "#2563EB"};animation:imap-glow 1.8s ease-in-out infinite}${doc.options.stopGlowOnHover ? ".imap-spot:hover{animation:none}" : ""}`
                : ""
            }
            ${doc.options?.customCss || ""}
          `}</style>
        )}
        {/* background fill (shows through transparent images / letterboxing) */}
        <rect x={0} y={0} width={W} height={H}
          fill={!ab.bg ? "#F3F4F6" : doc.options?.backgroundColor || "#ffffff"} />
        {ab.bg && (
          <image
            x={0}
            y={0}
            width={W}
            height={H}
            href={ab.bg}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
        {ab.shapes.map(renderShape)}
        {renderDraft()}
        {renderPolyDraft()}
        {renderSelection()}
      </svg>

      {/* live tooltip in preview */}
      {preview && tip && (tip.title || tip.description) && (
        <div
          className="absolute z-20 pointer-events-none rounded-[10px] px-3 py-2 shadow-lg"
          style={{
            left: tip.left,
            top: tip.top,
            transform: tip.transform,
            background: doc.options?.tooltipBg || "#0A0A0A",
            color: doc.options?.tooltipColor || "#fff",
            borderRadius: (doc.options?.tooltipRadius ?? 10) + "px",
            maxWidth: (doc.options?.tooltipMaxWidth ?? 240) + "px",
            fontFamily: TOOL_FONT,
          }}
        >
          {tip.title && <div className="text-xs font-semibold">{tip.title}</div>}
          {tip.description && (
            <div className="text-[11px] opacity-85 mt-0.5 leading-snug">
              {tip.description}
            </div>
          )}
        </div>
      )}

      {/* zoom controls in preview */}
      {zoomEnabled && doc.options?.zoomButtons && (
        <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5">
          {[
            { k: "in", label: "+", fn: () => { const r = wrapRef.current!.getBoundingClientRect(); zoomAt(1.3, r.width / 2, r.height / 2); } },
            { k: "out", label: "−", fn: () => { const r = wrapRef.current!.getBoundingClientRect(); zoomAt(1 / 1.3, r.width / 2, r.height / 2); } },
            { k: "reset", label: "⌂", fn: () => setView({ z: 1, px: 0, py: 0 }) },
          ].map((b) => (
            <button
              key={b.k}
              onClick={(e) => { e.stopPropagation(); b.fn(); }}
              className="w-8 h-8 rounded-[10px] bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 shadow-sm text-[#4B5563] dark:text-gray-400 hover:border-[#60A5FA] text-base leading-none"
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImapCanvas;
