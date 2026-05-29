<div align="center">

# 🖼️ Ultra Collage

**A production-grade, fully client-side photo collage maker for the web.**

Built with React 18 · TypeScript · Konva · Zustand · Tailwind CSS · Vite

</div>

---

Ultra Collage is a Canva/Fotor-style collage editor that runs entirely in your browser — no
backend, no uploads, no accounts. Your photos and projects live in IndexedDB on your own machine.

## ✨ Features

### Layout engine
- **Resizable grid collages** powered by a **binary split-tree** (the content-preserving layout
  used by Google Photos and collage-layout research). Drag any divider to re-flow the grid live.
- **15+ curated templates** across Grids, Featured (hero) and Mosaic categories, with live previews.
- **Justified / masonry mode** using Flickr's production `justified-layout` algorithm — keeps every
  photo's aspect ratio, no cropping.
- **Freeform mode** — drop photos, text, shapes and stickers anywhere and arrange them by hand.
- Split, merge and **swap** cells; drag a photo from the tray straight onto any cell.

### Photo editing
- Per-cell **pan / zoom / rotate / flip** with smooth `object-fit: cover` framing.
- **Filters & adjustments** — brightness, contrast, saturation, hue, blur, grayscale, sepia, invert,
  plus one-tap presets (Mono, Noir, Vintage, Warm, Cool, Vivid, Fade…), via Konva's filter pipeline.

### Design tools
- **Text** layers with font, weight, size, alignment, color, letter-spacing and drop shadow.
- **Shapes** (rect, circle, triangle, star, heart, line) and **emoji stickers**.
- Free-layer **Transformer** (resize + rotate), z-ordering, duplicate, lock, opacity.
- **Backgrounds**: solid color, gradient (with presets + angle), image (with blur/zoom), or transparent.
- Spacing, outer margin and corner-radius controls for the whole collage.

### Workflow
- **Undo / redo** (100 steps, coalesced) — `Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`.
- Keyboard shortcuts: delete, duplicate (`Ctrl/⌘+D`), arrow-key nudging.
- **Autosave** to IndexedDB — reload and your collage is still there.
- **Portable projects** — save/open a single `.collage.json` (images embedded).
- **High-resolution export** — PNG (with optional transparency) or JPEG, at 1×–4× scale, rendered on
  an offscreen stage independent of on-screen zoom so output is always crisp.

## 🏗️ Architecture

```
src/
  types.ts              Core domain model (CollageDoc, split-tree, layers, filters)
  layout/               Pure, unit-tested layout engine
    tree.ts             Binary split-tree ops (split / resize / swap / remove / fill)
    geometry.ts         Tree → absolute rects (spacing, padding, radius, splitter hit-areas)
    templates.ts        Curated layout factories
    justified.ts        Flickr justified-layout wrapper
  state/                Zustand store (immer) + zundo undo/redo + IndexedDB persistence
  canvas/               react-konva: CollageStage, CellNode, SplitHandle, FreeLayer, Background
  features/             images · filters · export (offscreen high-res renderer)
  app/ + components/ui/ App shell + shadcn-style UI primitives
```

**Key design choices** (see `src/types.ts` for the rationale):
- The **document is the single source of truth**; only it is tracked by undo/redo and persisted.
  Selection / zoom / active-tab are ephemeral and excluded from history.
- The same `geometry.ts` + `cellImage.ts` math drives both the live canvas and the export renderer,
  so what you see is exactly what you export.
- Image **blobs** are stored separately from the document JSON and re-hydrated into object URLs on
  load (object URLs don't survive a reload).

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build
npm run test       # vitest unit tests (layout tree + geometry)
```

## 🧪 Tests

Pure logic — the layout tree operations and geometry/cover-fit math — is covered by Vitest
(`src/layout/*.test.ts`). Run `npm run test`.

## 🧰 Tech stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| Canvas         | Konva + react-konva (scene-graph, fast) |
| State          | Zustand + immer, zundo for history      |
| Layout         | Binary split-tree + Flickr justified    |
| Persistence    | IndexedDB (`idb-keyval`)                |
| UI             | Tailwind CSS, shadcn-style components    |
| Build / test   | Vite, Vitest                             |

## 📄 License

MIT.
