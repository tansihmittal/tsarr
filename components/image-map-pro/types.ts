// Native Image Map Pro — data model + serializers.
// All geometry is stored in *image-pixel* coordinates (the SVG viewBox is the
// background image's natural size), so exports are resolution-independent.

export type ShapeType =
  | "rect"
  | "ellipse"
  | "polygon"
  | "image"
  | "text"
  | "pin";

// What happens when a visitor interacts with a spot.
export type SpotAction = "link" | "tooltip" | "none";
// Idle attention animation.
export type SpotAnimation = "none" | "pulse" | "glow";
// Where a tooltip appears relative to its spot.
export type TooltipPosition = "auto" | "top" | "right" | "bottom" | "left";
// How a tooltip opens.
export type TooltipTrigger = "hover" | "click";

export interface Shape {
  id: string;
  type: ShapeType;
  name: string;

  // Bounding box (rect / ellipse / image / text / pin). Polygons derive their
  // box from `points` but we keep x/y as an offset anchor of 0.
  x: number;
  y: number;
  width: number;
  height: number;

  // Polygon vertices, in image-pixel coordinates.
  points?: { x: number; y: number }[];

  // Embedded media / content.
  href?: string; // data URI or URL for `image`
  text?: string; // content for `text`
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "start" | "middle" | "end";

  // Pin / marker.
  pinLabel?: string; // number, letter or emoji shown inside the pin
  pinColor?: string;
  pinTextColor?: string;

  // Interactivity.
  action?: SpotAction;
  title?: string; // tooltip heading / accessible label
  description?: string; // tooltip body
  link?: string; // URL
  linkTarget?: "_blank" | "_self";
  tooltipPosition?: TooltipPosition;
  tooltipTrigger?: TooltipTrigger; // hover, or click (sticky)

  // Grouping (organisational; a group moves as one unit).
  groupId?: string;

  // Base style.
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity?: number;
  strokeDasharray?: string; // "" solid, e.g. "6 4" dashed
  cornerRadius?: number;
  opacity: number;
  shadow?: boolean;
  animation?: SpotAnimation;

  // Hover state (full, like the original's "mouseover style").
  hoverFill?: string;
  hoverFillOpacity?: number;
  hoverStroke?: string;
  hoverStrokeWidth?: number;
  hoverOpacity?: number;
  hoverScale?: number;
}

export interface MapOptions {
  backgroundColor: string;
  highlightOnHover: boolean; // dim the other spots when one is hovered
  pageloadAnimation: boolean; // fade + rise the spots in on load
  scaleSpots: boolean; // keep spot stroke crisp when responsive
  // Zoom & pan (preview + embed).
  zoom: boolean;
  zoomButtons: boolean;
  maxZoom: number;
  // Map-wide glow.
  glowAll: boolean;
  glowColor: string;
  stopGlowOnHover: boolean;
  // Default tooltip styling.
  tooltipBg: string;
  tooltipColor: string;
  tooltipRadius: number;
  tooltipMaxWidth: number;
  // Power users.
  customCss: string;
  customJs: string;
}

// An artboard is one image map (background + its spots). A document can hold
// several, switchable in the editor and the exported embed.
export interface Artboard {
  id: string;
  name: string;
  bg: string; // background image data URI / URL
  bgWidth: number;
  bgHeight: number;
  shapes: Shape[];
}

export interface ImapDocument {
  id: string;
  name: string;
  artboards: Artboard[];
  activeArtboard: string; // artboard id
  options: MapOptions;
  updatedAt: number;
}

export function createArtboard(name: string): Artboard {
  return { id: uid("ab"), name, bg: "", bgWidth: 0, bgHeight: 0, shapes: [] };
}

export function getActiveArtboard(doc: ImapDocument): Artboard {
  return (
    doc.artboards.find((a) => a.id === doc.activeArtboard) || doc.artboards[0]
  );
}

export const TOOL_FONT = "'IBM Plex Sans', sans-serif";

export function defaultMapOptions(): MapOptions {
  return {
    backgroundColor: "#ffffff",
    highlightOnHover: false,
    pageloadAnimation: true,
    scaleSpots: true,
    zoom: false,
    zoomButtons: true,
    maxZoom: 4,
    glowAll: false,
    glowColor: "#2563EB",
    stopGlowOnHover: true,
    tooltipBg: "#0A0A0A",
    tooltipColor: "#ffffff",
    tooltipRadius: 10,
    tooltipMaxWidth: 240,
    customCss: "",
    customJs: "",
  };
}

let counter = 0;
export function uid(prefix = "s"): string {
  counter += 1;
  return `${prefix}_${counter}_${Math.floor(performance.now())}`;
}

export function defaultStyleFor(type: ShapeType): Partial<Shape> {
  switch (type) {
    case "text":
      return {
        fill: "#0A0A0A",
        fillOpacity: 1,
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        fontSize: 28,
        fontFamily: TOOL_FONT,
        textAlign: "start",
        text: "Double-click to edit",
        action: "none",
      };
    case "image":
      return {
        fill: "transparent",
        fillOpacity: 1,
        stroke: "#2563EB",
        strokeWidth: 0,
        opacity: 1,
        action: "none",
      };
    case "pin":
      return {
        fill: "#2563EB",
        fillOpacity: 1,
        stroke: "#ffffff",
        strokeWidth: 2,
        opacity: 1,
        pinLabel: "",
        pinColor: "#2563EB",
        pinTextColor: "#ffffff",
        action: "tooltip",
        animation: "none",
      };
    default:
      return {
        fill: "#2563EB",
        fillOpacity: 0.22,
        stroke: "#2563EB",
        strokeWidth: 2,
        strokeOpacity: 1,
        opacity: 1,
        cornerRadius: type === "rect" ? 6 : 0,
        action: "link",
        animation: "none",
        hoverFill: "#2563EB",
        hoverFillOpacity: 0.4,
      };
  }
}

export function createShape(type: ShapeType, init: Partial<Shape>): Shape {
  const { _index, ...rest } = init as Partial<Shape> & { _index?: number };
  const count = _index ?? 0;
  return {
    id: uid(),
    type,
    name:
      init.name ||
      `${type[0].toUpperCase()}${type.slice(1)} ${count + 1}`,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    linkTarget: "_blank",
    action: "link",
    fill: "#2563EB",
    fillOpacity: 0.22,
    stroke: "#2563EB",
    strokeWidth: 2,
    strokeOpacity: 1,
    opacity: 1,
    animation: "none",
    ...defaultStyleFor(type),
    ...rest,
  };
}

// ---- Geometry helpers ----

export function shapeBounds(s: Shape) {
  if (s.type === "polygon" && s.points && s.points.length) {
    const xs = s.points.map((p) => p.x);
    const ys = s.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
    };
  }
  return { x: s.x, y: s.y, width: s.width, height: s.height };
}

// Pin geometry: a teardrop whose tip sits at the bottom-centre of the box.
export function pinGeometry(s: Shape) {
  const w = s.width || 36;
  const h = s.height || w * 1.3;
  const cx = s.x + w / 2;
  const r = w / 2;
  const cy = s.y + r;
  const tipY = s.y + h;
  return { cx, cy, r, tipY, w, h };
}

export function pinPath(s: Shape): string {
  const { cx, cy, r, tipY } = pinGeometry(s);
  // circle head + two tangents down to the tip
  const k = r * 0.55;
  return (
    `M ${cx - r} ${cy} ` +
    `a ${r} ${r} 0 1 1 ${r * 2} 0 ` +
    `c 0 ${k} ${-r * 0.6} ${k * 1.2} ${-r} ${tipY - cy} ` +
    `c ${-r * 0.4} ${-(tipY - cy - k * 1.2)} ${-r} ${-k * 0.45} ${-r} ${-r} Z`
  );
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Hotspot links are exported into embeddable HTML that runs on third-party
// sites, and are also followed directly in the editor's own Preview mode —
// so an unsanitized "javascript:" URL would execute wherever the map lands.
// Only allow schemes that can't run script; everything else (including
// relative paths, "#anchors", and bare "example.com") is left untouched.
const SAFE_LINK_SCHEMES = /^(https?:|mailto:|tel:)/i;
const DANGEROUS_LINK_SCHEMES = /^\s*(javascript|data|vbscript):/i;
export function sanitizeHref(url: string | undefined): string {
  const href = (url || "").trim();
  if (!href) return "";
  if (DANGEROUS_LINK_SCHEMES.test(href)) return "";
  if (href.includes(":") && !SAFE_LINK_SCHEMES.test(href)) {
    // has a scheme we don't recognize (not a relative/anchor link) - block it
    return "";
  }
  return href;
}

function styleVarsFor(s: Shape): string {
  const v: string[] = [];
  if (s.hoverFill) v.push(`--hf:${s.hoverFill}`);
  if (s.hoverFillOpacity != null) v.push(`--hfo:${s.hoverFillOpacity}`);
  if (s.hoverStroke) v.push(`--hs:${s.hoverStroke}`);
  if (s.hoverStrokeWidth != null) v.push(`--hsw:${s.hoverStrokeWidth}`);
  if (s.hoverOpacity != null) v.push(`--ho:${s.hoverOpacity}`);
  if (s.hoverScale != null) v.push(`--hsc:${s.hoverScale}`);
  if (s.animation === "glow") v.push(`--gc:${s.stroke || s.fill}`);
  return v.length ? ` style="${v.join(";")}"` : "";
}

function shapeClasses(s: Shape, interactive: boolean): string {
  const c = ["imap-spot"];
  if (interactive && s.animation && s.animation !== "none")
    c.push(`imap-anim-${s.animation}`);
  return c.join(" ");
}

function geomAttrs(s: Shape): string {
  return (
    `fill="${s.fill}" fill-opacity="${s.fillOpacity}" ` +
    `stroke="${s.stroke}" stroke-width="${s.strokeWidth}" ` +
    `stroke-opacity="${s.strokeOpacity ?? 1}" ` +
    (s.strokeDasharray ? `stroke-dasharray="${s.strokeDasharray}" ` : "") +
    `opacity="${s.opacity}"` +
    (s.shadow ? ' filter="url(#imap-shadow)"' : "")
  );
}

function dataAttrs(s: Shape): string {
  const a: string[] = [];
  const hasTip =
    (s.action === "tooltip" || (s.action !== "none" && !s.link)) &&
    (s.title || s.description);
  if (hasTip) {
    a.push(`data-trigger="${s.tooltipTrigger || "hover"}"`);
    a.push(`data-pos="${s.tooltipPosition || "auto"}"`);
  }
  return a.length ? " " + a.join(" ") : "";
}

function shapeGeometrySvg(s: Shape, interactive: boolean): string {
  const cls = interactive
    ? ` class="${shapeClasses(s, interactive)}" data-id="${esc(s.id)}"${dataAttrs(s)}${styleVarsFor(s)}`
    : "";
  const common = geomAttrs(s);

  switch (s.type) {
    case "rect":
      return `<rect${cls} x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="${s.cornerRadius ?? 0}" ${common}/>`;
    case "ellipse":
      return `<ellipse${cls} cx="${s.x + s.width / 2}" cy="${s.y + s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" ${common}/>`;
    case "polygon": {
      const pts = (s.points || []).map((p) => `${p.x},${p.y}`).join(" ");
      return `<polygon${cls} points="${pts}" ${common}/>`;
    }
    case "image":
      return `<image${cls} x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" opacity="${s.opacity}"${s.shadow ? ' filter="url(#imap-shadow)"' : ""} preserveAspectRatio="xMidYMid meet" href="${esc(s.href || "")}"/>`;
    case "text": {
      const anchor = s.textAlign || "start";
      const tx = anchor === "middle" ? s.x + s.width / 2 : anchor === "end" ? s.x + s.width : s.x;
      return `<text${cls} x="${tx}" y="${s.y + (s.fontSize || 28)}" font-family="${esc(s.fontFamily || TOOL_FONT)}" font-size="${s.fontSize || 28}" fill="${s.fill}" fill-opacity="${s.fillOpacity}" opacity="${s.opacity}" text-anchor="${anchor}">${esc(s.text || "")}</text>`;
    }
    case "pin": {
      const g = pinGeometry(s);
      const label = s.pinLabel
        ? `<text x="${g.cx}" y="${g.cy}" font-family="${esc(TOOL_FONT)}" font-size="${g.r * 0.95}" font-weight="600" fill="${s.pinTextColor || "#fff"}" text-anchor="middle" dominant-baseline="central">${esc(s.pinLabel)}</text>`
        : "";
      return (
        `<g${cls}${s.shadow ? ' filter="url(#imap-shadow)"' : ""} opacity="${s.opacity}">` +
        `<path d="${pinPath(s)}" fill="${s.pinColor || s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>` +
        label +
        `</g>`
      );
    }
    default:
      return "";
  }
}

function shapeSvg(s: Shape, interactive: boolean): string {
  let inner = shapeGeometrySvg(s, interactive);
  const titleEl = s.title ? `<title>${esc(s.title)}</title>` : "";
  inner = `${inner}${titleEl}`;
  const safeHref = interactive && s.action !== "none" && s.action !== "tooltip" ? sanitizeHref(s.link) : "";
  if (safeHref) {
    return `<a href="${esc(safeHref)}" target="${s.linkTarget || "_blank"}" rel="noopener">${inner}</a>`;
  }
  return inner;
}

const BASE_CSS = `
.imap-spot{transition:fill .15s,fill-opacity .15s,stroke .15s,stroke-width .15s,opacity .15s,transform .15s;transform-box:fill-box;transform-origin:center;cursor:pointer}
.imap-spot:hover{fill:var(--hf,inherit);fill-opacity:var(--hfo,inherit);stroke:var(--hs,inherit);stroke-width:var(--hsw,inherit);opacity:var(--ho,inherit);transform:scale(var(--hsc,1))}
@keyframes imap-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.imap-anim-pulse{animation:imap-pulse 1.6s ease-in-out infinite}
@keyframes imap-glow{0%,100%{filter:drop-shadow(0 0 0 var(--gc,#2563EB))}50%{filter:drop-shadow(0 0 7px var(--gc,#2563EB))}}
.imap-anim-glow{animation:imap-glow 1.8s ease-in-out infinite}
@keyframes imap-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`.trim();

export interface ExportOptions {
  interactive?: boolean;
}

export function documentToSvg(doc: ImapDocument, opts: ExportOptions = {}): string {
  const interactive = opts.interactive ?? true;
  const o = doc.options || defaultMapOptions();
  const ab = getActiveArtboard(doc);
  const w = ab.bgWidth || 1000;
  const h = ab.bgHeight || 1000;

  let css = interactive ? BASE_CSS : "";
  if (interactive && o.highlightOnHover) {
    css += `\nsvg:hover .imap-spot:not(:hover){opacity:.35}`;
  }
  // Combine pageload-rise and map-wide glow into a single animation rule so
  // they don't clobber each other (CSS `animation` is one property).
  if (interactive && (o.pageloadAnimation || o.glowAll)) {
    const anims: string[] = [];
    if (o.pageloadAnimation) anims.push("imap-rise .5s ease both");
    if (o.glowAll) anims.push("imap-glow 1.8s ease-in-out infinite");
    css += `\n.imap-spot{--gc:${o.glowColor || "#2563EB"};animation:${anims.join(",")}}`;
    if (o.glowAll && o.stopGlowOnHover) {
      css += `\n.imap-spot:hover{animation:${o.pageloadAnimation ? "imap-rise .5s ease both" : "none"}}`;
    }
  }
  if (o.customCss) css += `\n${o.customCss}`;
  const styleBlock = css ? `<style>${css}</style>` : "";

  const defs = interactive
    ? `<defs><filter id="imap-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.35"/></filter></defs>`
    : "";

  const bgRect = o.backgroundColor && o.backgroundColor !== "#ffffff"
    ? `<rect x="0" y="0" width="${w}" height="${h}" fill="${o.backgroundColor}"/>`
    : "";
  const bg = ab.bg
    ? `<image x="0" y="0" width="${w}" height="${h}" href="${esc(ab.bg)}" preserveAspectRatio="xMidYMid meet"/>`
    : "";
  const body = ab.shapes.map((s) => shapeSvg(s, interactive)).join("\n  ");

  return `<!-- ${esc(doc.name)} — interactive image map · made with tsarr.in -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(doc.name)}">
  ${styleBlock}
  ${defs}
  ${bgRect}
  ${bg}
  ${body}
</svg>`;
}

// Self-contained interactive embed: SVG + a runtime that powers styled tooltips
// (hover or sticky, positioned), highlight-on-hover, click actions, optional
// zoom & pan, and any custom JS. No external dependencies.
export function documentToEmbedHtml(doc: ImapDocument): string {
  const o = doc.options || defaultMapOptions();
  const ab = getActiveArtboard(doc);
  const svg = documentToSvg(doc, { interactive: true }).replace(
    "<svg ",
    '<svg class="imap-svg" '
  );

  const tips = ab.shapes
    .filter((s) => (s.action === "tooltip" || (s.action !== "none" && !s.link)) && (s.title || s.description))
    .map(
      (s) =>
        `<template data-for="${esc(s.id)}"><div class="imap-tt-h">${esc(s.title || "")}</div>${s.description ? `<div class="imap-tt-b">${esc(s.description)}</div>` : ""}</template>`
    )
    .join("");

  const zoomBtns =
    o.zoom && o.zoomButtons
      ? `<div class="imap-zoom"><button data-z="in" aria-label="Zoom in">+</button><button data-z="out" aria-label="Zoom out">&minus;</button><button data-z="reset" aria-label="Reset">&#x2302;</button></div>`
      : "";

  const customJs = o.customJs
    ? `<script>(function(){try{${o.customJs}}catch(e){console.error("Image map custom JS:",e)}})();</script>`
    : "";

  return `<!-- ${esc(doc.name)} — interactive image map · made with tsarr.in -->
<div class="imap-embed" style="max-width:${ab.bgWidth || 1000}px;margin:0 auto;position:relative">
  <style>
    .imap-embed .imap-viewport{overflow:hidden;position:relative}
    .imap-embed .imap-stage{transform-origin:0 0;${o.zoom ? "cursor:grab" : ""}}
    .imap-embed .imap-stage.grabbing{cursor:grabbing}
    .imap-embed .imap-svg{width:100%;height:auto;display:block}
    .imap-embed .imap-tt{position:absolute;z-index:20;pointer-events:none;opacity:0;transition:opacity .12s;background:${o.tooltipBg};color:${o.tooltipColor};border-radius:${o.tooltipRadius}px;padding:8px 11px;max-width:${o.tooltipMaxWidth}px;font:13px/1.45 ${TOOL_FONT};box-shadow:0 6px 24px rgba(0,0,0,.18)}
    .imap-embed .imap-tt.on{opacity:1}
    .imap-embed .imap-tt-h{font-weight:600;margin-bottom:2px}
    .imap-embed .imap-tt-b{opacity:.85}
    .imap-embed .imap-zoom{position:absolute;right:10px;bottom:10px;z-index:25;display:flex;flex-direction:column;gap:4px}
    .imap-embed .imap-zoom button{width:30px;height:30px;border:1px solid rgba(0,0,0,.12);background:#fff;border-radius:8px;font-size:16px;line-height:1;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.12)}
    ${o.customCss || ""}
  </style>
  <div class="imap-viewport">
    <div class="imap-stage">${svg}</div>
  </div>
  ${zoomBtns}
  <div class="imap-tt"></div>
  <div style="display:none">${tips}</div>
  <script>(function(){
    var root=document.currentScript.parentNode;
    var vp=root.querySelector('.imap-viewport'), stage=root.querySelector('.imap-stage');
    var svg=root.querySelector('.imap-svg'), tt=root.querySelector('.imap-tt');
    var ZOOM=${o.zoom ? "true" : "false"}, MAXZ=${o.maxZoom || 4};
    var tpls={}; root.querySelectorAll('template[data-for]').forEach(function(t){tpls[t.getAttribute('data-for')]=t.innerHTML});

    function place(el,pos,e){
      var rr=root.getBoundingClientRect(), b=el.getBoundingClientRect();
      var cx=b.left-rr.left+b.width/2, cy=b.top-rr.top+b.height/2;
      if(pos==='auto' && e){ tt.style.left=(e.clientX-rr.left)+'px'; tt.style.top=(e.clientY-rr.top)+'px'; tt.style.transform='translate(-50%,calc(-100% - 10px))'; return; }
      var p=pos==='auto'?'top':pos;
      if(p==='top'){tt.style.left=cx+'px';tt.style.top=(b.top-rr.top)+'px';tt.style.transform='translate(-50%,calc(-100% - 10px))';}
      else if(p==='bottom'){tt.style.left=cx+'px';tt.style.top=(b.bottom-rr.top)+'px';tt.style.transform='translate(-50%,10px)';}
      else if(p==='left'){tt.style.left=(b.left-rr.left)+'px';tt.style.top=cy+'px';tt.style.transform='translate(calc(-100% - 10px),-50%)';}
      else{tt.style.left=(b.right-rr.left)+'px';tt.style.top=cy+'px';tt.style.transform='translate(10px,-50%)';}
    }
    var pinned=null;
    function showTip(el,e){ var id=el.getAttribute('data-id'); if(!id||!tpls[id])return; tt.innerHTML=tpls[id]; place(el,el.getAttribute('data-pos')||'auto',e); tt.classList.add('on'); }
    function hideTip(){ tt.classList.remove('on'); pinned=null; }

    svg.querySelectorAll('.imap-spot[data-trigger]').forEach(function(el){
      var trig=el.getAttribute('data-trigger');
      if(trig==='click'){
        el.style.cursor='pointer';
        el.addEventListener('click',function(e){ e.stopPropagation(); if(pinned===el){hideTip();} else {pinned=el; showTip(el,e);} });
      } else {
        el.addEventListener('mousemove',function(e){ if(pinned)return; showTip(el,e); });
        el.addEventListener('mouseenter',function(e){ if(pinned)return; showTip(el,e); });
        el.addEventListener('mouseleave',function(){ if(!pinned) tt.classList.remove('on'); });
      }
    });
    document.addEventListener('click',function(){ if(pinned) hideTip(); });

    if(ZOOM){
      var z=1,px=0,py=0,drag=false,sx=0,sy=0,moved=false;
      function apply(){ stage.style.transform='translate('+px+'px,'+py+'px) scale('+z+')'; }
      function clamp(){ var r=vp.getBoundingClientRect(); var minX=r.width-r.width*z, minY=r.height-r.height*z; px=Math.min(0,Math.max(minX,px)); py=Math.min(0,Math.max(minY,py)); }
      function zoomTo(nz,ox,oy){ nz=Math.min(MAXZ,Math.max(1,nz)); var k=nz/z; px=ox-(ox-px)*k; py=oy-(oy-py)*k; z=nz; clamp(); apply(); }
      vp.addEventListener('wheel',function(e){ e.preventDefault(); var r=vp.getBoundingClientRect(); zoomTo(z*(e.deltaY<0?1.12:0.9),e.clientX-r.left,e.clientY-r.top); },{passive:false});
      vp.addEventListener('pointerdown',function(e){ drag=true; moved=false; sx=e.clientX-px; sy=e.clientY-py; stage.classList.add('grabbing'); });
      window.addEventListener('pointermove',function(e){ if(!drag)return; px=e.clientX-sx; py=e.clientY-sy; moved=true; clamp(); apply(); });
      window.addEventListener('pointerup',function(){ drag=false; stage.classList.remove('grabbing'); });
      vp.addEventListener('click',function(e){ if(moved){ e.preventDefault(); e.stopPropagation(); } },true);
      var zc=root.querySelector('.imap-zoom');
      if(zc) zc.addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; var r=vp.getBoundingClientRect(),cx=r.width/2,cy=r.height/2; var a=b.getAttribute('data-z'); if(a==='in')zoomTo(z*1.3,cx,cy); else if(a==='out')zoomTo(z/1.3,cx,cy); else {z=1;px=0;py=0;apply();} });
    }
  })();</script>
  ${customJs}
</div>`;
}

export function documentToJson(doc: ImapDocument): string {
  return JSON.stringify(doc, null, 2);
}
