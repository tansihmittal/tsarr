import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import { normalizeImageFile, IMAGE_ACCEPT } from "@/utils/imageFile";
import Navigation from "../common/Navigation";
import { Button } from "@/components/ui/button";
import {
  BsStars,
  BsUpload,
  BsCursor,
  BsSquare,
  BsCircle,
  BsBoundingBox,
  BsImage,
  BsFonts,
  BsEye,
  BsEyeSlash,
  BsArrowCounterclockwise,
  BsArrowClockwise,
  BsDownload,
  BsClipboard,
  BsTrash,
  BsPlusLg,
  BsFolder2,
  BsCodeSlash,
  BsFiletypeJson,
  BsLayoutSidebarInset,
  BsGeoAltFill,
  BsSliders,
  BsChevronDown,
  BsChevronRight,
  BsCollection,
  BsSearch,
  BsXLg,
} from "react-icons/bs";
import type { SegmentedMask, LabeledBox } from "@/pages/api/detect-regions";
import { yoloDetector, YOLO_CLASSES, type DetectionResult } from "@/utils/yoloDetection";
import ImapCanvas, { Tool } from "./ImapCanvas";
import ImapProperties from "./ImapProperties";
import {
  Shape,
  ShapeType,
  Artboard,
  ImapDocument,
  MapOptions,
  createShape,
  createArtboard,
  getActiveArtboard,
  uid,
  documentToSvg,
  documentToEmbedHtml,
  documentToJson,
  defaultMapOptions,
  TOOL_FONT,
} from "./types";
import ImapMapOptions from "./ImapMapOptions";
import { maskToPolygons, maskToBBox } from "./maskToPolygon";

const PROJECTS_KEY = "imp-projects-v2";
const MAX_HISTORY = 60;

interface StoredProject {
  id: string;
  name: string;
  doc: ImapDocument;
  updatedAt: number;
}

function loadProjects(): StoredProject[] {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
  } catch {
    return [];
  }
}
function persistProjects(list: StoredProject[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
}

function emptyDoc(): ImapDocument {
  const ab = createArtboard("Artboard 1");
  return {
    id: uid("doc"),
    name: "Untitled map",
    artboards: [ab],
    activeArtboard: ab.id,
    options: defaultMapOptions(),
    updatedAt: Date.now(),
  };
}

// Handles both old flat format (pre-artboard) and new artboard format.
function migrateDoc(d: any): ImapDocument {
  if (!d.artboards) {
    // Legacy flat document — wrap in a single artboard.
    const ab = createArtboard("Artboard 1");
    ab.bg = d.bg || "";
    ab.bgWidth = d.bgWidth || 0;
    ab.bgHeight = d.bgHeight || 0;
    ab.shapes = d.shapes || [];
    return {
      id: d.id || uid("doc"),
      name: d.name || "Untitled map",
      artboards: [ab],
      activeArtboard: ab.id,
      options: { ...defaultMapOptions(), ...(d.options || {}) },
      updatedAt: d.updatedAt || Date.now(),
    };
  }
  return { ...d, options: { ...defaultMapOptions(), ...(d.options || {}) } };
}

const TOOLS: { id: Tool; icon: any; label: string; key: string }[] = [
  { id: "select", icon: BsCursor, label: "Select", key: "V" },
  { id: "rect", icon: BsSquare, label: "Rectangle", key: "R" },
  { id: "ellipse", icon: BsCircle, label: "Ellipse", key: "O" },
  { id: "polygon", icon: BsBoundingBox, label: "Polygon", key: "P" },
  { id: "pin", icon: BsGeoAltFill, label: "Pin / marker", key: "M" },
  { id: "image", icon: BsImage, label: "Image", key: "I" },
  { id: "text", icon: BsFonts, label: "Text", key: "T" },
];

const ImageMapProLayout: React.FC = () => {
  const [doc, setDocState] = useState<ImapDocument>(emptyDoc);
  const docRef = useRef<ImapDocument>(doc);
  const setDoc = (d: ImapDocument) => {
    docRef.current = d;
    setDocState(d);
  };

  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectOpen, setDetectOpen] = useState(false);
  const [detectText, setDetectText] = useState("");
  const [detectShape, setDetectShape] = useState<ShapeType>("rect");
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"props" | "map">("props");
  const [layerSearch, setLayerSearch] = useState("");
  const [marked, setMarked] = useState<string[]>([]); // layers selected for grouping
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // history — kept in refs (source of truth) with a tick to re-render button state.
  const baseline = useRef<Shape[]>(getActiveArtboard(doc).shapes);
  const pastRef = useRef<Shape[][]>([]);
  const futureRef = useRef<Shape[][]>([]);
  const [, bumpHist] = useState(0);
  const refreshHist = useCallback(() => bumpHist((n) => n + 1), []);
  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  // file inputs
  const bgInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const placeImageInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const importJsonRef = useRef<HTMLInputElement>(null);
  const pendingImage = useRef<{ href: string; w: number; h: number } | null>(null);
  const replaceTargetId = useRef<string | null>(null);
  const [pendingImageHref, setPendingImageHref] = useState<string | null>(null);

  const selected = getActiveArtboard(doc).shapes.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  // ---------- shape state + history ----------
  const applyShapes = useCallback(
    (next: Shape[], record: boolean) => {
      const cur = docRef.current;
      const ab = getActiveArtboard(cur);
      const artboards = cur.artboards.map((a) =>
        a.id === ab.id ? { ...ab, shapes: next } : a
      );
      const d = { ...cur, artboards, updatedAt: Date.now() };
      setDoc(d);
      if (record) {
        pastRef.current = [...pastRef.current.slice(-MAX_HISTORY), baseline.current];
        futureRef.current = [];
        baseline.current = next;
        refreshHist();
      }
    },
    [refreshHist]
  );

  const resetHistory = useCallback(
    (shapes: Shape[]) => {
      baseline.current = shapes;
      pastRef.current = [];
      futureRef.current = [];
      refreshHist();
    },
    [refreshHist]
  );

  const updateShape = useCallback(
    (id: string, patch: Partial<Shape>, record = true) => {
      const next = getActiveArtboard(docRef.current).shapes.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      );
      applyShapes(next, record);
    },
    [applyShapes]
  );

  const updateOptions = useCallback((patch: Partial<MapOptions>) => {
    const d = {
      ...docRef.current,
      options: { ...docRef.current.options, ...patch },
      updatedAt: Date.now(),
    };
    setDoc(d);
  }, []);

  const commitShape = useCallback(
    (partial: Shape, type: ShapeType) => {
      const init: Partial<Shape> = { ...partial };
      if (type === "image" && pendingImage.current) {
        init.href = pendingImage.current.href;
        const { w, h } = pendingImage.current;
        if (w && h && init.width) init.height = (init.width * h) / w;
      }
      if (type === "pin") {
        // Click-to-place: size the marker and anchor its tip at the click.
        const size = 40;
        init.width = size;
        init.height = size * 1.32;
        init.x = (partial.x ?? 0) - size / 2;
        init.y = (partial.y ?? 0) - size * 1.32;
      }
      const abShapes = getActiveArtboard(docRef.current).shapes;
      const shape = createShape(type, {
        ...init,
        _index: abShapes.length,
      } as any);
      applyShapes([...abShapes, shape], true);
      setSelectedId(shape.id);
      setTool("select");
      if (type === "image") {
        pendingImage.current = null;
        setPendingImageHref(null);
      }
    },
    [applyShapes]
  );

  const deleteShape = useCallback(
    (id: string) => {
      applyShapes(
        getActiveArtboard(docRef.current).shapes.filter((s) => s.id !== id),
        true
      );
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [applyShapes]
  );

  const duplicateShape = useCallback(
    (id: string) => {
      const s = getActiveArtboard(docRef.current).shapes.find((x) => x.id === id);
      if (!s) return;
      const copy: Shape = {
        ...JSON.parse(JSON.stringify(s)),
        id: uid(),
        name: `${s.name} copy`,
        x: s.x + 16,
        y: s.y + 16,
        points: s.points?.map((p) => ({ x: p.x + 16, y: p.y + 16 })),
      };
      applyShapes([...getActiveArtboard(docRef.current).shapes, copy], true);
      setSelectedId(copy.id);
    },
    [applyShapes]
  );

  const reorder = useCallback(
    (id: string, dir: "front" | "back") => {
      const arr = [...getActiveArtboard(docRef.current).shapes];
      const idx = arr.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const [item] = arr.splice(idx, 1);
      if (dir === "front") arr.push(item);
      else arr.unshift(item);
      applyShapes(arr, true);
    },
    [applyShapes]
  );

  // ---------- groups ----------
  const groupMarked = useCallback(() => {
    if (marked.length < 2) return;
    const gid = uid("grp");
    applyShapes(
      getActiveArtboard(docRef.current).shapes.map((s) =>
        marked.includes(s.id) ? { ...s, groupId: gid } : s
      ),
      true
    );
    setMarked([]);
  }, [marked, applyShapes]);

  const ungroup = useCallback(
    (groupId: string) => {
      applyShapes(
        getActiveArtboard(docRef.current).shapes.map((s) =>
          s.groupId === groupId ? { ...s, groupId: undefined } : s
        ),
        true
      );
    },
    [applyShapes]
  );

  const toggleMark = useCallback((id: string, additive: boolean) => {
    setMarked((m) => {
      if (!additive) return [id];
      return m.includes(id) ? m.filter((x) => x !== id) : [...m, id];
    });
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [baseline.current, ...futureRef.current];
    baseline.current = prev;
    const cur = docRef.current;
    const ab = getActiveArtboard(cur);
    setDoc({ ...cur, artboards: cur.artboards.map((a) => a.id === ab.id ? { ...ab, shapes: prev } : a) });
    setSelectedId(null);
    refreshHist();
  }, [refreshHist]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, baseline.current];
    baseline.current = next;
    const cur = docRef.current;
    const ab = getActiveArtboard(cur);
    setDoc({ ...cur, artboards: cur.artboards.map((a) => a.id === ab.id ? { ...ab, shapes: next } : a) });
    setSelectedId(null);
    refreshHist();
  }, [refreshHist]);

  // ---------- artboards ----------
  const addArtboard = useCallback(() => {
    const ab = createArtboard(`Artboard ${docRef.current.artboards.length + 1}`);
    const d = { ...docRef.current, artboards: [...docRef.current.artboards, ab], activeArtboard: ab.id };
    setDoc(d);
    resetHistory([]);
    setSelectedId(null);
  }, [resetHistory]);

  const switchArtboard = useCallback((id: string) => {
    if (id === docRef.current.activeArtboard) return;
    const d = { ...docRef.current, activeArtboard: id };
    const ab = d.artboards.find((a) => a.id === id) || d.artboards[0];
    setDoc(d);
    resetHistory(ab.shapes);
    setSelectedId(null);
  }, [resetHistory]);

  const deleteArtboard = useCallback((id: string) => {
    if (docRef.current.artboards.length <= 1) return;
    const remaining = docRef.current.artboards.filter((a) => a.id !== id);
    const newActive = docRef.current.activeArtboard === id ? remaining[0].id : docRef.current.activeArtboard;
    const d = { ...docRef.current, artboards: remaining, activeArtboard: newActive };
    setDoc(d);
    const ab = remaining.find((a) => a.id === newActive) || remaining[0];
    resetHistory(ab.shapes);
    setSelectedId(null);
  }, [resetHistory]);

  const renameArtboard = useCallback((id: string, name: string) => {
    setDoc({ ...docRef.current, artboards: docRef.current.artboards.map((a) => a.id === id ? { ...a, name } : a) });
  }, []);

  const [renamingAb, setRenamingAb] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  // ---------- background / images ----------
  const loadImageData = async (file: File): Promise<{ href: string; w: number; h: number }> => {
    const normalized = await normalizeImageFile(file);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const href = reader.result as string;
        const img = new Image();
        img.onload = () => resolve({ href, w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => reject(new Error("Could not read image"));
        img.src = href;
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(normalized);
    });
  };

  const handleBgFile = useCallback(
    async (file: File) => {
      try {
        const { href, w, h } = await loadImageData(file);
        const cur = docRef.current;
        const ab = getActiveArtboard(cur);
        const updatedAb: Artboard = { ...ab, bg: href, bgWidth: w, bgHeight: h };
        const d: ImapDocument = {
          ...cur,
          artboards: cur.artboards.map((a) => a.id === ab.id ? updatedAb : a),
          name: cur.name === "Untitled map" ? file.name.replace(/\.[^.]+$/, "") : cur.name,
        };
        setDoc(d);
        resetHistory(updatedAb.shapes);
        toast.success("Image loaded");
      } catch (e: any) {
        toast.error(e.message || "Failed to load image");
      }
    },
    [resetHistory]
  );

  const startPlaceImage = () => placeImageInputRef.current?.click();

  const onPlaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await loadImageData(file);
      pendingImage.current = data;
      setPendingImageHref(data.href);
      setTool("image");
      toast("Draw a box on the canvas to place the image");
    } catch (err: any) {
      toast.error(err.message || "Failed to load image");
    }
  };

  const onReplaceImage = (id: string) => {
    replaceTargetId.current = id;
    replaceImageInputRef.current?.click();
  };
  const onReplaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const id = replaceTargetId.current;
    if (!file || !id) return;
    try {
      const { href } = await loadImageData(file);
      updateShape(id, { href }, true);
      toast.success("Image replaced");
    } catch (err: any) {
      toast.error(err.message || "Failed to load image");
    }
  };

  // ---------- AI detect ----------
  // Two engines: in-browser YOLOv11 (fast, free, common objects) for boxes, and
  // SAM3 (open-vocab, server) for polygon outlines and arbitrary-text masks.
  const ELLIPSE_TERMS = /\b(round|circle|circular|ellipse|oval)\b/i;
  const COCO_SYNONYMS: Record<string, string> = {
    people: "person", human: "person", humans: "person", man: "person",
    men: "person", woman: "person", women: "person", guy: "person",
    girl: "person", boy: "person", lady: "person", face: "person",
  };

  const loadImageEl = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });

  // COCO class names referenced by a free-text instruction (plurals + synonyms).
  const matchCoco = (inst: string): string[] => {
    const t = inst.toLowerCase();
    const found = new Set<string>();
    for (const cls of YOLO_CLASSES) {
      if (t.includes(cls)) found.add(cls);
    }
    for (const w of t.split(/\W+/).filter(Boolean)) {
      const sing = w.endsWith("s") ? w.slice(0, -1) : w;
      if ((YOLO_CLASSES as readonly string[]).includes(sing)) found.add(sing);
      if (COCO_SYNONYMS[w]) found.add(COCO_SYNONYMS[w]);
    }
    return Array.from(found);
  };

  // Run the in-browser YOLO detector against the active background.
  const runYolo = async (
    src: string,
    classFilter?: string[]
  ): Promise<DetectionResult[]> => {
    await yoloDetector.loadModel();
    const im = await loadImageEl(src);
    let dets = await yoloDetector.detect(im, 0.35);
    if (classFilter && classFilter.length)
      dets = dets.filter((d) => classFilter.includes(d.className));
    return dets;
  };

  // Ask the server (SAM3) to segment one or more text prompts → masks.
  const segment = async (
    src: string,
    prompts: string[]
  ): Promise<SegmentedMask[]> => {
    const res = await fetch("/api/detect-regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: src, prompts }),
    });
    const data = await res.json();
    if (!res.ok && data.error) throw new Error(data.error);
    return (data.masks as SegmentedMask[]) || [];
  };

  // "Label this / annotate / what are the parts" → enumerate intent (no specific
  // object named). These want the VLM to list & box every part of the image.
  const META_INTENT =
    /\b(la?bel|annotate|identif|describe|mark|tag|caption|enumerate|name)\b|\b(everything|all|each|parts?|components?|elements?|sections?|this|these|them|it)\b/i;
  const isMetaInstruction = (inst: string) =>
    inst.length === 0 || (META_INTENT.test(inst) && matchCoco(inst).length === 0);

  // Server VLM: identify & box all distinct parts/objects, in bg-pixel coords.
  const enumerate = async (
    src: string,
    instruction: string
  ): Promise<{ label: string; x: number; y: number; w: number; h: number }[]> => {
    const res = await fetch("/api/detect-regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: src, mode: "enumerate", instruction }),
    });
    const data = await res.json();
    if (!res.ok && data.error) throw new Error(data.error);
    return ((data.boxes as LabeledBox[]) || []).map((b) => ({
      label: b.label,
      x: b.x * curAbW(),
      y: b.y * curAbH(),
      w: b.width * curAbW(),
      h: b.height * curAbH(),
    }));
  };

  // Unified "find everything" — try free in-browser YOLO first, fall back to the
  // VLM for novel content YOLO's 80 classes don't cover (boards, diagrams, …).
  const getEnumeration = async (
    src: string,
    instruction: string,
    onPhase: (msg: string) => void
  ): Promise<{ label: string; x: number; y: number; w: number; h: number }[]> => {
    onPhase("Detecting objects…");
    const dets = await runYolo(src);
    if (dets.length) {
      return dets.map((d) => ({
        label: d.className,
        x: d.bbox[0],
        y: d.bbox[1],
        w: d.bbox[2],
        h: d.bbox[3],
      }));
    }
    onPhase("Labeling with AI…");
    return enumerate(src, instruction);
  };

  const curAbW = () => getActiveArtboard(docRef.current).bgWidth;
  const curAbH = () => getActiveArtboard(docRef.current).bgHeight;

  const runDetect = async (instruction?: string, overrideShape?: ShapeType) => {
    const curAb = getActiveArtboard(doc);
    if (!curAb.bg) {
      toast.error("Upload a background image first");
      return;
    }
    const inst = (instruction || "").trim();
    const shapeFromInst = inst && ELLIPSE_TERMS.test(inst) ? "ellipse" : null;
    const chosenShape: ShapeType = overrideShape ?? shapeFromInst ?? detectShape;
    const W = curAb.bgWidth;
    const H = curAb.bgHeight;

    setDetectOpen(false);
    setIsDetecting(true);
    const id = toast.loading(
      inst ? `Looking for "${inst}"…` : "Detecting regions…"
    );

    const labelName = (label: string, k: number, total: number) =>
      total > 1 ? `${label} ${k + 1}` : label;

    // Build a shape from a labeled box, honoring the chosen shape type.
    const boxToShape = (
      it: { label: string; x: number; y: number; w: number; h: number },
      index: number
    ): Shape => {
      if (chosenShape === "polygon") {
        return createShape("polygon", {
          _index: index,
          name: it.label,
          title: it.label,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          points: [
            { x: it.x, y: it.y },
            { x: it.x + it.w, y: it.y },
            { x: it.x + it.w, y: it.y + it.h },
            { x: it.x, y: it.y + it.h },
          ],
        } as any);
      }
      return createShape(chosenShape, {
        _index: index,
        name: it.label,
        title: it.label,
        x: it.x,
        y: it.y,
        width: it.w,
        height: it.h,
      } as any);
    };

    try {
      const abShapes = getActiveArtboard(docRef.current).shapes;

      // ─── ENUMERATE INTENT ─────────────────────────────────────────────
      // Empty, or vague/meta like "label this" → find & label every region.
      // (YOLO for common objects, VLM for novel content like boards/diagrams.)
      if (isMetaInstruction(inst)) {
        const items = await getEnumeration(curAb.bg, inst, (m) =>
          toast.loading(m, { id })
        );
        if (!items.length) {
          toast.error("Couldn't find anything to label — try naming it", {
            id,
          });
          return;
        }
        const newShapes = items.map((it, i) =>
          boxToShape(it, abShapes.length + i)
        );
        applyShapes([...abShapes, ...newShapes], true);
        toast.success(
          `Labeled ${items.length} region${items.length > 1 ? "s" : ""}`,
          { id }
        );
        return;
      }

      // ─── TARGETED: a specific object was named ────────────────────────
      // Polygon → SAM3 mask → traced outline(s).
      if (chosenShape === "polygon") {
        toast.loading("Segmenting…", { id });
        const masks = await segment(curAb.bg, [inst]);
        if (!masks.length) {
          toast.error(`Couldn't segment "${inst}"`, { id });
          return;
        }
        toast.loading("Tracing outlines…", { id });
        const newShapes: Shape[] = [];
        for (const m of masks) {
          const polys = await maskToPolygons(m.maskBase64, W, H);
          polys.forEach((pts, k) =>
            newShapes.push(
              createShape("polygon", {
                _index: abShapes.length + newShapes.length,
                name: labelName(m.label, k, polys.length),
                title: m.label,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                points: pts,
              } as any)
            )
          );
        }
        if (!newShapes.length) {
          toast.error("Couldn't trace an outline — try Box mode", { id });
          return;
        }
        applyShapes([...abShapes, ...newShapes], true);
        toast.success(
          `Added ${newShapes.length} outline${newShapes.length > 1 ? "s" : ""}`,
          { id }
        );
        return;
      }

      // Box / Round + named object → YOLO if it's a COCO class, else SAM3 bbox.
      const cocoMatches = matchCoco(inst);
      if (cocoMatches.length > 0) {
        toast.loading("Detecting objects…", { id });
        const dets = await runYolo(curAb.bg, cocoMatches);
        if (dets.length) {
          const newShapes = dets.map((d, i) =>
            boxToShape(
              { label: d.className, x: d.bbox[0], y: d.bbox[1], w: d.bbox[2], h: d.bbox[3] },
              abShapes.length + i
            )
          );
          applyShapes([...abShapes, ...newShapes], true);
          toast.success(
            `Added ${dets.length} region${dets.length > 1 ? "s" : ""}`,
            { id }
          );
          return;
        }
        // Matched a class name but found none → fall through to SAM3.
      }

      toast.loading("Segmenting…", { id });
      const masks = await segment(curAb.bg, [inst]);
      const newShapes: Shape[] = [];
      for (const m of masks) {
        const box = await maskToBBox(m.maskBase64, W, H);
        if (!box) continue;
        newShapes.push(
          boxToShape(
            { label: m.label, x: box.x, y: box.y, w: box.width, h: box.height },
            abShapes.length + newShapes.length
          )
        );
      }
      if (!newShapes.length) {
        toast.error(`Nothing matching "${inst}" found`, { id });
        return;
      }
      applyShapes([...abShapes, ...newShapes], true);
      toast.success(
        `Added ${newShapes.length} region${newShapes.length > 1 ? "s" : ""}`,
        { id }
      );
    } catch (err: any) {
      toast.error(err.message || "AI detection failed", { id });
    } finally {
      setIsDetecting(false);
    }
  };

  // ---------- projects ----------
  const saveProject = () => {
    const list = loadProjects();
    const entry: StoredProject = {
      id: doc.id,
      name: doc.name,
      doc: { ...docRef.current, updatedAt: Date.now() },
      updatedAt: Date.now(),
    };
    const idx = list.findIndex((p) => p.id === doc.id);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    persistProjects(list);
    setProjects(list);
    toast.success("Project saved");
  };

  const openProject = (p: StoredProject) => {
    const d = migrateDoc(p.doc);
    setDoc(d);
    resetHistory(getActiveArtboard(d).shapes);
    setSelectedId(null);
    setTool("select");
    setPreview(false);
  };

  const deleteProject = (id: string) => {
    const list = loadProjects().filter((p) => p.id !== id);
    persistProjects(list);
    setProjects(list);
    toast.success("Project deleted");
  };

  const newProject = () => {
    setDoc(emptyDoc());
    resetHistory([]);
    setSelectedId(null);
    setTool("select");
    setPreview(false);
  };

  // ---------- export ----------
  const download = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const exportSvg = () => {
    if (!getActiveArtboard(doc).bg) return toast.error("Add a background image first");
    download(
      documentToSvg(docRef.current, { interactive: true }),
      `${doc.name || "image-map"}.svg`,
      "image/svg+xml"
    );
    setExportOpen(false);
  };
  const copyEmbed = () => {
    if (!getActiveArtboard(doc).bg) return toast.error("Add a background image first");
    copy(documentToEmbedHtml(docRef.current), "Embed HTML");
    setExportOpen(false);
  };
  const exportJson = () => {
    download(documentToJson(docRef.current), `${doc.name || "image-map"}.json`, "application/json");
    setExportOpen(false);
  };
  const onImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.shapes && !parsed.artboards) throw new Error("Invalid map file");
      const d = migrateDoc({ ...parsed, id: parsed.id || uid("doc") });
      setDoc(d);
      resetHistory(getActiveArtboard(d).shapes);
      setSelectedId(null);
      toast.success("Map imported");
    } catch (err: any) {
      toast.error(err.message || "Failed to import");
    }
  };

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateShape(selectedId);
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveProject();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteShape(selectedId);
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      const found = TOOLS.find((tl) => tl.key.toLowerCase() === e.key.toLowerCase());
      if (found && !mod) {
        if (found.id === "image") startPlaceImage();
        else setTool(found.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, undo, redo, duplicateShape, deleteShape]);

  const editText = (id: string) => {
    const s = getActiveArtboard(docRef.current).shapes.find((x) => x.id === id);
    if (!s) return;
    const next = window.prompt("Edit text", s.text || "");
    if (next != null) updateShape(id, { text: next }, true);
  };

  const shapeIcon = (t: ShapeType) => {
    switch (t) {
      case "rect":
        return BsSquare;
      case "ellipse":
        return BsCircle;
      case "polygon":
        return BsBoundingBox;
      case "image":
        return BsImage;
      case "text":
        return BsFonts;
      case "pin":
        return BsGeoAltFill;
      default:
        return BsSquare;
    }
  };

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt),
    [projects]
  );

  // ---------- render ----------
  return (
    <div
      className="h-screen flex flex-col bg-[#FBFBFD] overflow-hidden"
      style={{ fontFamily: TOOL_FONT }}
    >
      <Navigation />

      {/* hidden inputs */}
      <input ref={bgInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleBgFile(f); }} />
      <input ref={aiInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" />
      <input ref={placeImageInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onPlaceImageFile} />
      <input ref={replaceImageInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onReplaceImageFile} />
      <input ref={importJsonRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportJson} />

      {/* Toolbar — relative z-30 keeps its dropdowns (AI Detect, Export) above
          the canvas/sidebars, which otherwise paint over them and swallow clicks. */}
      <div className="relative z-30 shrink-0 border-b border-[#E5E7EB] bg-white/90 backdrop-blur px-3 py-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowSidebar((v) => !v)}
          title="Toggle panels"
          className="w-9 h-9 rounded-[12px] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F9FAFB] shrink-0"
        >
          <BsLayoutSidebarInset className="w-4 h-4" />
        </button>

        <input
          value={doc.name}
          onChange={(e) => setDoc({ ...docRef.current, name: e.target.value })}
          className="w-[150px] rounded-[12px] border border-transparent hover:border-[#E5E7EB] focus:border-[#60A5FA] bg-transparent px-2.5 py-1.5 text-sm font-semibold text-[#0A0A0A] focus:outline-none truncate"
        />

        {/* tool group */}
        <div className="flex items-center gap-1 p-1 rounded-[14px] bg-[#F3F4F6] border border-[#E5E7EB]">
          {TOOLS.map((tl) => {
            const Icon = tl.icon;
            const active = tool === tl.id;
            return (
              <button
                key={tl.id}
                title={`${tl.label} (${tl.key})`}
                onClick={() => (tl.id === "image" ? startPlaceImage() : setTool(tl.id))}
                disabled={!getActiveArtboard(doc).bg && tl.id !== "select"}
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  active
                    ? "bg-[#0A0A0A] text-white shadow-sm"
                    : "text-[#4B5563] hover:bg-white"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* undo / redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            className="w-9 h-9 rounded-[12px] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-30"
          >
            <BsArrowCounterclockwise className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            className="w-9 h-9 rounded-[12px] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F9FAFB] disabled:opacity-30"
          >
            <BsArrowClockwise className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            disabled={isDetecting || !getActiveArtboard(doc).bg}
            onClick={() => setDetectOpen((v) => !v)}
            className="gap-1.5 text-[#2563EB] border-[#BFDBFE] hover:bg-[#EFF6FF]"
          >
            <BsStars className="w-3.5 h-3.5" />
            {isDetecting ? "Detecting…" : "AI Detect"}
          </Button>
          {detectOpen && !isDetecting && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDetectOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-[14px] border border-[#E5E7EB] shadow-lg p-3 z-50">
                <p className="text-xs font-semibold text-[#0A0A0A] mb-1.5">
                  Tell the AI what to mark
                </p>
                <input
                  autoFocus
                  value={detectText}
                  onChange={(e) => setDetectText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runDetect(detectText.trim());
                  }}
                  placeholder="e.g. all the buttons, faces, products…"
                  className="w-full rounded-[10px] border border-[#E5E7EB] bg-white px-2.5 py-2 text-xs text-[#0A0A0A] placeholder:text-[#4B5563]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#60A5FA]"
                />
                <p className="text-[11px] text-[#4B5563]/45 mt-1.5 leading-relaxed">
                  Describe what to turn into hotspots, or leave blank to auto-detect
                  everything.
                </p>
                {/* Shape selector */}
                <div className="mt-2.5">
                  <p className="text-[11px] font-medium text-[#4B5563]/70 mb-1.5">Shape</p>
                  <div className="flex gap-1.5">
                    {(["rect", "ellipse", "polygon"] as ShapeType[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setDetectShape(s)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] border transition-colors ${
                          detectShape === s
                            ? "bg-[#2563EB] text-white border-[#2563EB]"
                            : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#60A5FA]"
                        }`}
                      >
                        {s === "rect" && <BsSquare className="w-3 h-3" />}
                        {s === "ellipse" && <BsCircle className="w-3 h-3" />}
                        {s === "polygon" && <BsBoundingBox className="w-3 h-3" />}
                        {s === "rect" ? "Box" : s === "ellipse" ? "Round" : "Polygon"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <Button
                    size="sm"
                    onClick={() => runDetect(detectText.trim())}
                    className="flex-1 gap-1.5"
                  >
                    <BsStars className="w-3.5 h-3.5" />
                    {detectText.trim() ? "Find these" : "Auto-detect"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setPreview((v) => !v)}
          className={`h-[38px] px-4 rounded-full text-sm font-medium flex items-center gap-1.5 border transition-colors ${
            preview
              ? "bg-[#2563EB] text-white border-[#2563EB]"
              : "bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#60A5FA]"
          }`}
        >
          {preview ? <BsEyeSlash className="w-3.5 h-3.5" /> : <BsEye className="w-3.5 h-3.5" />}
          {preview ? "Editing" : "Preview"}
        </button>

        <Button variant="ghost" size="sm" onClick={saveProject} className="gap-1.5">
          <BsFolder2 className="w-3.5 h-3.5" />
          Save
        </Button>

        {/* export menu */}
        <div className="relative">
          <Button size="sm" onClick={() => setExportOpen((v) => !v)} className="gap-1.5">
            <BsDownload className="w-3.5 h-3.5" />
            Export
          </Button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-[14px] border border-[#E5E7EB] shadow-lg p-1.5 z-50">
                <MenuItem icon={BsDownload} label="Download SVG" sub="Interactive, self-contained" onClick={exportSvg} />
                <MenuItem icon={BsCodeSlash} label="Copy embed HTML" sub="Paste into any site" onClick={copyEmbed} />
                <MenuItem icon={BsClipboard} label="Copy SVG markup" onClick={() => { copy(documentToSvg(docRef.current), "SVG"); setExportOpen(false); }} />
                <div className="h-px bg-[#E5E7EB] my-1" />
                <MenuItem icon={BsFiletypeJson} label="Export project (.json)" onClick={exportJson} />
                <MenuItem icon={BsUpload} label="Import project (.json)" onClick={() => { importJsonRef.current?.click(); setExportOpen(false); }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: layers + projects */}
        {showSidebar && (
          <aside className="w-[210px] shrink-0 border-r border-[#E5E7EB] bg-white flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#4B5563]/60 uppercase tracking-wider">
                Layers
              </span>
              {marked.length >= 2 ? (
                <button
                  onClick={groupMarked}
                  className="text-[11px] font-medium text-[#2563EB] flex items-center gap-1 hover:underline"
                >
                  <BsCollection className="w-3 h-3" /> Group {marked.length}
                </button>
              ) : (
                <span className="text-[11px] text-[#4B5563]/40">{getActiveArtboard(doc).shapes.length}</span>
              )}
            </div>

            {/* search */}
            <div className="px-2 pt-2">
              <div className="relative">
                <BsSearch className="w-3 h-3 text-[#4B5563]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={layerSearch}
                  onChange={(e) => setLayerSearch(e.target.value)}
                  placeholder="Search objects…"
                  className="w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-7 pr-7 py-1.5 text-xs text-[#0A0A0A] placeholder:text-[#4B5563]/40 focus:outline-none focus:border-[#60A5FA]"
                />
                {layerSearch && (
                  <button
                    onClick={() => setLayerSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4B5563]/40 hover:text-[#4B5563]"
                  >
                    <BsXLg className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {getActiveArtboard(doc).shapes.length === 0 && (
                <p className="text-xs text-[#4B5563]/40 text-center px-3 py-6 leading-relaxed">
                  No shapes yet. Pick a tool above and draw on your image.
                </p>
              )}
              {(() => {
                const q = layerSearch.trim().toLowerCase();
                const match = (s: Shape) => !q || s.name.toLowerCase().includes(q);
                const ordered = [...getActiveArtboard(doc).shapes].reverse();
                const done = new Set<string>();
                const out: JSX.Element[] = [];

                const row = (s: Shape, indent: boolean) => {
                  const Icon = shapeIcon(s.type);
                  const active = s.id === selectedId;
                  const isMarked = marked.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => {
                        if (e.shiftKey || e.metaKey || e.ctrlKey) {
                          toggleMark(s.id, true);
                        } else {
                          setSelectedId(s.id);
                          setMarked([]);
                          setPreview(false);
                        }
                      }}
                      className={`group flex items-center gap-2 px-2 py-1.5 rounded-[10px] cursor-pointer ${indent ? "ml-3" : ""} ${
                        active
                          ? "bg-[#EFF6FF] text-[#2563EB]"
                          : isMarked
                          ? "bg-[#EFF6FF]/60 text-[#2563EB] ring-1 ring-[#BFDBFE]"
                          : "text-[#4B5563] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 text-xs truncate">{s.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteShape(s.id); }}
                        className="opacity-0 group-hover:opacity-100 text-[#4B5563]/50 hover:text-red-500"
                      >
                        <BsTrash className="w-3 h-3" />
                      </button>
                    </div>
                  );
                };

                for (const s of ordered) {
                  if (s.groupId) {
                    if (done.has(s.groupId)) continue;
                    done.add(s.groupId);
                    const members = ordered.filter((m) => m.groupId === s.groupId);
                    const visible = members.filter(match);
                    if (q && visible.length === 0) continue;
                    const collapsed = collapsedGroups[s.groupId];
                    out.push(
                      <div key={s.groupId} className="rounded-[10px]">
                        <div
                          onClick={() =>
                            setCollapsedGroups((c) => ({ ...c, [s.groupId!]: !c[s.groupId!] }))
                          }
                          className="group flex items-center gap-1.5 px-2 py-1.5 rounded-[10px] cursor-pointer text-[#4B5563] hover:bg-[#F9FAFB]"
                        >
                          {collapsed ? (
                            <BsChevronRight className="w-2.5 h-2.5 shrink-0" />
                          ) : (
                            <BsChevronDown className="w-2.5 h-2.5 shrink-0" />
                          )}
                          <BsCollection className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1 text-xs font-medium truncate">
                            Group
                          </span>
                          <span className="text-[10px] text-[#4B5563]/40">
                            {members.length}
                          </span>
                          <button
                            title="Ungroup"
                            onClick={(e) => { e.stopPropagation(); ungroup(s.groupId!); }}
                            className="opacity-0 group-hover:opacity-100 text-[#4B5563]/50 hover:text-[#2563EB]"
                          >
                            <BsXLg className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {!collapsed && (q ? visible : members).map((m) => row(m, true))}
                      </div>
                    );
                  } else {
                    if (!match(s)) continue;
                    out.push(row(s, false));
                  }
                }
                return out;
              })()}
            </div>

            <div className="border-t border-[#E5E7EB] px-3 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#4B5563]/60 uppercase tracking-wider">
                Projects
              </span>
              <button onClick={newProject} title="New" className="text-[#4B5563]/60 hover:text-[#2563EB]">
                <BsPlusLg className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-[28%] overflow-y-auto p-1.5 space-y-0.5">
              {sortedProjects.length === 0 && (
                <p className="text-[11px] text-[#4B5563]/40 text-center px-2 py-2">
                  Saved projects appear here.
                </p>
              )}
              {sortedProjects.map((p) => (
                <div
                  key={p.id}
                  className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-[10px] cursor-pointer ${
                    p.id === doc.id ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#4B5563] hover:bg-[#F9FAFB]"
                  }`}
                  onClick={() => openProject(p)}
                >
                  <span className="flex-1 text-xs truncate">{p.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[#4B5563]/50 hover:text-red-500"
                  >
                    <BsTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Center: canvas */}
        <div className="flex-1 relative overflow-hidden bg-[linear-gradient(rgba(79,70,229,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.04)_1px,transparent_1px)] bg-[size:24px_24px]">
          {!getActiveArtboard(doc).bg ? (
            <div className="absolute inset-0 bottom-9 flex items-center justify-center p-6">
              <div
                className="w-full max-w-xl flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#E5E7EB] bg-white/70 py-20 cursor-pointer hover:border-[#60A5FA] transition-colors"
                onClick={() => bgInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleBgFile(f); }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="w-14 h-14 rounded-[18px] bg-[#EFF6FF] flex items-center justify-center mb-4">
                  <BsImage className="w-7 h-7 text-[#2563EB]/60" />
                </div>
                <p className="text-base font-semibold text-[#0A0A0A] mb-1">
                  Drop an image to begin
                </p>
                <p className="text-sm text-[#4B5563]/55 mb-5">
                  Then draw clickable hotspots, add images, text & shapes.
                </p>
                <Button size="sm" className="gap-2">
                  <BsUpload className="w-3.5 h-3.5" />
                  Upload Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bottom-9 p-4">
              <ImapCanvas
                doc={doc}
                tool={tool}
                selectedId={selectedId}
                preview={preview}
                pendingImageHref={pendingImageHref}
                onCommit={commitShape}
                onUpdate={updateShape}
                onSelect={setSelectedId}
                onEditText={editText}
              />
            </div>
          )}

          {/* Artboard tab switcher */}
          <div className="absolute bottom-0 left-0 right-0 h-9 flex items-center gap-0.5 px-2 bg-white/90 backdrop-blur border-t border-[#E5E7EB] z-10 overflow-x-auto">
            {doc.artboards.map((ab) => {
              const isActive = ab.id === doc.activeArtboard;
              return (
                <div key={ab.id} className="relative shrink-0 group">
                  {renamingAb === ab.id ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={() => { renameArtboard(ab.id, renameVal || ab.name); setRenamingAb(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { renameArtboard(ab.id, renameVal || ab.name); setRenamingAb(null); }
                        if (e.key === "Escape") setRenamingAb(null);
                      }}
                      className="h-6 px-2 text-[11px] rounded-[6px] border border-[#60A5FA] outline-none bg-white min-w-[80px] max-w-[120px]"
                    />
                  ) : (
                    <button
                      onClick={() => switchArtboard(ab.id)}
                      onDoubleClick={() => { setRenamingAb(ab.id); setRenameVal(ab.name); }}
                      className={`h-6 px-2.5 rounded-[6px] text-[11px] font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-[#0A0A0A] text-white"
                          : "text-[#4B5563] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      {ab.name}
                    </button>
                  )}
                  {isActive && doc.artboards.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteArtboard(ab.id); }}
                      title="Delete artboard"
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#EF4444] text-white text-[8px] items-center justify-center hidden group-hover:flex leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={addArtboard}
              title="New artboard"
              className="h-6 w-6 rounded-[6px] flex items-center justify-center text-[#4B5563] hover:bg-[#F3F4F6] shrink-0 ml-1 text-base leading-none"
            >
              +
            </button>
          </div>

          {/* hint bar */}
          {getActiveArtboard(doc).bg && !preview && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-[#E5E7EB] rounded-full px-4 py-1.5 text-[11px] text-[#4B5563]/70 shadow-sm pointer-events-none">
              {tool === "polygon"
                ? "Click to add points · double-click or Enter to finish · Esc to cancel"
                : tool === "select"
                ? "Click a shape to select · drag to move · drag handles to resize"
                : "Drag on the image to draw"}
            </div>
          )}
        </div>

        {/* Right: properties / map options */}
        {showSidebar && (
          <aside className="w-[280px] shrink-0 border-l border-[#E5E7EB] bg-[#FBFBFD] overflow-y-auto p-3">
            <div className="flex items-center gap-1 p-1 mb-3 rounded-[12px] bg-[#F3F4F6] border border-[#E5E7EB]">
              <button
                onClick={() => setRightTab("props")}
                className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                  rightTab === "props" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#4B5563]"
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setRightTab("map")}
                className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  rightTab === "map" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#4B5563]"
                }`}
              >
                <BsSliders className="w-3 h-3" /> Map
              </button>
            </div>

            {rightTab === "props" ? (
              <>
                {getActiveArtboard(doc).bg && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => bgInputRef.current?.click()}
                      className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      <BsUpload className="w-3 h-3" /> Change image
                    </button>
                  </div>
                )}
                <ImapProperties
                  shape={selected}
                  onUpdate={updateShape}
                  onDelete={deleteShape}
                  onDuplicate={duplicateShape}
                  onReorder={reorder}
                  onReplaceImage={onReplaceImage}
                />
              </>
            ) : (
              <ImapMapOptions options={doc.options} onChange={updateOptions} />
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

function MenuItem({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: any;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[10px] text-left hover:bg-[#F3F4F6]"
    >
      <Icon className="w-4 h-4 mt-0.5 text-[#4B5563] shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#0A0A0A]">{label}</p>
        {sub && <p className="text-[10px] text-[#4B5563]/50 truncate">{sub}</p>}
      </div>
    </button>
  );
}

export default ImageMapProLayout;
