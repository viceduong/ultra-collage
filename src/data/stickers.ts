import type { ShapeKind } from '@/types'

/** Emoji stickers grouped for the elements panel. */
export const STICKER_GROUPS: { name: string; emojis: string[] }[] = [
  { name: 'Love', emojis: ['❤️', '💛', '💚', '💙', '💜', '🩷', '💖', '💗', '💕', '😍', '🥰', '😘'] },
  { name: 'Fun', emojis: ['😀', '😎', '🤩', '🥳', '😂', '😜', '🤪', '🙌', '👍', '✌️', '🤙', '💯'] },
  { name: 'Decor', emojis: ['⭐', '🌟', '✨', '💫', '🌈', '☀️', '🌸', '🌺', '🌷', '🍀', '🎀', '👑'] },
  { name: 'Travel', emojis: ['✈️', '🏖️', '🏔️', '🗺️', '📸', '🧳', '🚗', '⛵', '🌍', '🎡', '🏝️', '🌅'] },
  { name: 'Party', emojis: ['🎉', '🎊', '🎈', '🎁', '🥂', '🍾', '🎂', '🍰', '🎵', '🎶', '🪩', '🔥'] },
]

export const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: 'rect', label: 'Rectangle' },
  { kind: 'ellipse', label: 'Circle' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'star', label: 'Star' },
  { kind: 'heart', label: 'Heart' },
  { kind: 'line', label: 'Line' },
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
