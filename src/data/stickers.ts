/**
 * SVG sticker glyphs — rendered as Konva.Path for consistent quality
 * across all platforms (no emoji rendering issues).
 */
export interface StickerGlyph {
  id: string
  label: string
  path: string
  fill: string
  stroke?: string
  strokeWidth?: number
  viewBox?: string
}

export const STICKER_GROUPS: { name: string; stickers: StickerGlyph[] }[] = [
  {
    name: 'Love',
    stickers: [
      { id: 'heart-red', label: 'Heart', path: 'M12 21s-8-5-8-11a4 4 0 0 1 7.5-1.5A4 4 0 0 1 20 10c0 6-8 11-8 11z', fill: '#ef4444' },
      { id: 'heart-pink', label: 'Heart', path: 'M12 21s-8-5-8-11a4 4 0 0 1 7.5-1.5A4 4 0 0 1 20 10c0 6-8 11-8 11z', fill: '#ec4899' },
      { id: 'heart-small', label: 'Small Heart', path: 'M12 20s-6-4-6-8.5A2.5 2.5 0 0 1 12 9a2.5 2.5 0 0 1 6 2.5c0 4.5-6 8.5-6 8.5z', fill: '#f43f5e' },
      { id: 'star-gold', label: 'Star', path: 'M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 5.2L8 14l-6-4.8h7.6z', fill: '#f59e0b' },
      { id: 'star-sparkle', label: 'Sparkle', path: 'M12 2l1.2 3.6H17l-3 2.4 1.2 3.6-3-2.4-3 2.4 1.2-3.6-3-2.4h3.8z', fill: '#fbbf24' },
      { id: 'flower', label: 'Flower', path: 'M12 2a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5 5a5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5zm-5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', fill: '#ec4899' },
      { id: 'heart-beat', label: 'Heartbeat', path: 'M12 20l-1.5-1.4C5.5 14.2 2 11 2 7.5A5.5 5.5 0 0 1 7.5 2c1.7 0 3.4.8 4.5 2A5.5 5.5 0 0 1 16.5 2 5.5 5.5 0 0 1 22 7.5c0 3.5-3.5 6.7-8.5 11.2L12 20z', fill: '#ff6b6b' },
    ],
  },
  {
    name: 'Decor',
    stickers: [
      { id: 'sparkles', label: 'Sparkles', path: 'M5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8L5 2zm4 12l.8 2.2L12 17l-2.2.8L9 20l-.8-2.2L6 17l2.2-.8L9 14zm8-10l.6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6L17 4z', fill: '#f59e0b' },
      { id: 'sun', label: 'Sun', path: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7l1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9M19.1 19.1l-1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z', fill: '#f59e0b' },
      { id: 'moon', label: 'Moon', path: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', fill: '#6366f1' },
      { id: 'leaf', label: 'Leaf', path: 'M11 20A7 7 0 0 1 9.8 6.9C15.5 5 21 4 21 4s-1 5.5-2.9 11.2A7 7 0 0 1 11 20z', fill: '#10b981' },
      { id: 'droplet', label: 'Droplet', path: 'M12 2.7l4.5 8.9a6 6 0 1 1-9 0L12 2.7z', fill: '#3b82f6' },
      { id: 'crown', label: 'Crown', path: 'M2 19l3-14 4 6 3-7 4 7 4-6 3 14H2z', fill: '#f59e0b' },
    ],
  },
  {
    name: 'Shapes',
    stickers: [
      { id: 'circle', label: 'Circle', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', fill: '#6366f1' },
      { id: 'hexagon', label: 'Hexagon', path: 'M12 2l8.7 5v10L12 22l-8.7-5V7L12 2z', fill: '#8b5cf6' },
      { id: 'diamond', label: 'Diamond', path: 'M12 2l8 10-8 10-8-10 8-10z', fill: '#ec4899' },
      { id: 'triangle-up', label: 'Triangle', path: 'M12 3l10 18H2l10-18z', fill: '#f59e0b' },
      { id: 'pentagon', label: 'Pentagon', path: 'M12 2l9.5 6.8-3.6 11H6.1l-3.6-11L12 2z', fill: '#10b981' },
      { id: 'cross', label: 'Cross', path: 'M15 2v5h5v6h-5v9H9v-9H4V7h5V2h6z', fill: '#ef4444' },
    ],
  },
  {
    name: 'Arrows',
    stickers: [
      { id: 'arrow-up', label: 'Arrow Up', path: 'M12 5l8 8h-6v8h-4v-8H4l8-8z', fill: '#3b82f6' },
      { id: 'arrow-right', label: 'Arrow Right', path: 'M5 12h14m-6-6l6 6-6 6', fill: 'none', stroke: '#10b981', strokeWidth: 3 },
      { id: 'arrow-down', label: 'Arrow Down', path: 'M12 19l-8-8h6V3h4v8h6l-8 8z', fill: '#f59e0b' },
      { id: 'arrow-left', label: 'Arrow Left', path: 'M19 12H5m6-6l-6 6 6 6', fill: 'none', stroke: '#ec4899', strokeWidth: 3 },
      { id: 'corner-up', label: 'Corner Up', path: 'M9 10l-5 5 5 5M4 15h11a4 4 0 0 0 4-4V4', fill: 'none', stroke: '#6366f1', strokeWidth: 2.5 },
      { id: 'refresh', label: 'Refresh', path: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15', fill: 'none', stroke: '#8b5cf6', strokeWidth: 2.5 },
    ],
  },
  {
    name: 'Party',
    stickers: [
      { id: 'confetti', label: 'Confetti', path: 'M4 20l3-3m14-1l-4 4M12 4l-2 10 4 2-2-12zM6 8l1 5 3-1-4-4zM18 5l-2 7 4 1-2-8z', fill: '#f59e0b' },
      { id: 'balloon', label: 'Balloon', path: 'M7 18c-3-3-3-8 0-11s7-3 10 0 3 8 0 11l-2 3H9l-2-3z', fill: '#ef4444' },
      { id: 'gift', label: 'Gift', path: 'M4 11h16v10H4V11zM4 7h16v4H4V7zm4-4a2 2 0 0 1 4 0 2 2 0 1 1 4 0', fill: 'none', stroke: '#ec4899', strokeWidth: 2.5 },
      { id: 'fire', label: 'Fire', path: 'M12 23c-4 0-7-3-7-7 0-4 3.5-8 5-10 1.5 2 5 6 5 10 0 4-3 7-7 7z', fill: '#f97316' },
      { id: 'music', label: 'Music', path: 'M9 17V5l12-2v12M9 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', fill: '#8b5cf6' },
      { id: 'celebration', label: 'Celebration', path: 'M22 2l-5 5m0 0l-4 10 3 3 10-4-4-9zm0 0l4-4M6 12l-4 4 2 2 4-4-2-2zm10 4l-4 4m-6-8l-4-2', fill: 'none', stroke: '#f59e0b', strokeWidth: 2.5 },
    ],
  },
]

/** Pre-baked background gradient presets. */
export const GRADIENT_PRESETS: { from: string; to: string }[] = [
  { from: '#f6d365', to: '#fda085' },
  { from: '#a1c4fd', to: '#c2e9fb' },
  { from: '#fbc2eb', to: '#a6c1ee' },
  { from: '#84fab0', to: '#8fd3f4' },
  { from: '#fdcbf1', to: '#e6dee9' },
  { from: '#ff9a9e', to: '#fecfef' },
  { from: '#667eea', to: '#764ba2' },
  { from: '#0f2027', to: '#2c5364' },
]

export const SOLID_PRESETS = [
  '#ffffff', '#000000', '#f8fafc', '#111827', '#6366f1', '#ec4899',
  '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#fde68a', '#fca5a5',
]

export const FONT_FAMILIES = [
  'Inter',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Arial',
  'Verdana',
  'Trebuchet MS',
  'Impact',
]
