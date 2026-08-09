# tsarr-tools-cli

Command-line and MCP-server access to a subset of [tsarr.in](https://tsarr.in)'s tools, for developers and AI coding agents.

## Scope

**Ported with full fidelity** (pure Canvas/image math or a genuinely portable engine, no browser-only ML dependency):

- `app-icon` — iOS/Android/Web/macOS app icon set as a ZIP
- `resize` — resize by dimensions or percentage
- `convert` — convert between png/jpeg/webp/avif/gif/tiff/ico
- `palette` — dominant color extraction (k-means)
- `qr` — QR code generation (13 payload types: text, sms, wifi, vcard, event, link, email, phone, app, file, whatsapp, crypto, upi)
- `watermark-remove` — Telea-style inpainting, guided by a mask image
- `screenshot` — capture a webpage at a device viewport (desktop/tablet/mobile) via headless Chrome
- `aspect-ratio` — convert to a target ratio or custom size, with contain/cover/fill/crop fitting
- `text-detect` / `text-replace` — OCR-detect text regions (Tesseract, genuinely Node-portable) then swap any region's text in place

**Ported with reduced scope** (the browser versions capture a live DOM/CSS layout via html2canvas; there's no Node equivalent of "rasterize arbitrary CSS," so these are rebuilt as an SVG mirroring the same layer stack, rendered in one pass — visually close but not pixel-identical to the browser output):

- `tweet-card` — default/minimal tweet card styles with solid backgrounds. Not included: the CSS noise-texture overlay, and the card tilt/scale/position transform.
- `polaroid` — background, frame, border, rotation, shadow, caption, vignette, one of 9 light-leak gradients, and film grain, plus the underlying brightness/contrast/saturation/hue-rotate/blur adjustments. Not included: the 29 named "filter" presets (vintage/sepia/etc. — use the raw adjustment numbers a preset would set instead), the frame-texture overlays (paper/grain/ragged), and the hoga-specific extra vignette. Captions need the caption font (Caveat, Permanent Marker, etc.) installed as a **system font** on the machine running the CLI — SVG rendering resolves an unavailable font family the same way a browser does: silent fallback, not an error.
- `carousel` — text-only, image-top, and image-bottom slide layouts, multi-slide (one PNG per slide). Not included: the "app-showcase" layout (pill, app icon, giant faded slide number, screenshot composition) and the profile row.

**Not included** (browser-only ML models — `@imgly/background-removal`, `@tensorflow-models/body-pix`, `@xenova/transformers`, Kokoro-onnx — with no server-side equivalent in the main app today): `background-remover`, `text-behind-image`, `bubble-blaster`, `video-captions`, `text-to-speech`. Porting these needs either a Node ML runtime or a hosted inference API — a separate, bigger effort.

## Install & build

```bash
cd cli
npm install
npm run build
```

`puppeteer` (for `screenshot`) downloads its own Chromium on install; `tesseract.js` (for `text-detect`) downloads English trained data on first use. Both are self-contained — no system packages required.

## CLI usage

```bash
node dist/cli.js app-icon logo.png --out icons.zip --platforms ios,android,web,macos --background '#ffffff' --padding 5
node dist/cli.js resize photo.jpg --out photo-800.jpg --width 800 --format jpeg --quality 85
node dist/cli.js convert photo.png --out photo.webp --format webp
node dist/cli.js palette photo.jpg --count 6 --out palette.json
node dist/cli.js qr "https://example.com" --type link --out qr.png --fg '#2563EB'
node dist/cli.js qr wifi --type wifi --field ssid=MyNetwork --field password=hunter2 --out wifi.png
node dist/cli.js watermark-remove photo.png --mask mask.png --out clean.png
node dist/cli.js screenshot "https://example.com" --out shot.jpg --device mobile
node dist/cli.js aspect-ratio photo.jpg --out square.png --ratio 1:1 --fit cover
node dist/cli.js text-detect photo.png --out regions.json   # then edit "newText" in regions.json
node dist/cli.js text-replace photo.png --regions regions.json --out edited.png
node dist/cli.js tweet-card "Hello world" --out tweet.png --name "Jane Doe" --username jane --theme dark --metrics
node dist/cli.js polaroid photo.jpg --out polaroid.png --caption "Summer 2024" --light-leak warm --grain --vignette
node dist/cli.js carousel slides.json --out-dir slides-out --layout text-only
```

`carousel`'s `slides.json` is an array of `{ headline, subheadline, description, image, ctaText, showNumber, number }` objects, one per slide.

Once published (or linked globally with `npm link`), the same commands run as `tsarr <command> ...`.

## MCP server (for AI IDEs)

After building, register the server with your MCP client (Claude Code, Cursor, etc.) via stdio. Example `mcpServers` config entry:

```json
{
  "mcpServers": {
    "tsarr-tools": {
      "command": "node",
      "args": ["/absolute/path/to/cli/dist/mcp.js"]
    }
  }
}
```

This exposes 13 tools, same parameters as the CLI commands above: `generate_app_icons`, `resize_image`, `convert_image`, `extract_palette`, `generate_qr`, `remove_watermark`, `capture_screenshot`, `convert_aspect_ratio`, `detect_text`, `replace_text`, `generate_tweet_card`, `generate_polaroid`, `generate_carousel`.
