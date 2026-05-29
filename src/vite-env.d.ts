/// <reference types="vite/client" />

declare module 'justified-layout' {
  interface JustifiedLayoutOptions {
    containerWidth?: number
    containerPadding?: number | { top: number; right: number; bottom: number; left: number }
    boxSpacing?: number | { horizontal: number; vertical: number }
    targetRowHeight?: number
    targetRowHeightTolerance?: number
    maxNumRows?: number
    forceAspectRatio?: boolean | number
    showWidows?: boolean
    fullWidthBreakoutRowCadence?: boolean | number
  }
  interface JustifiedLayoutBox {
    aspectRatio: number
    top: number
    left: number
    width: number
    height: number
  }
  interface JustifiedLayoutResult {
    containerHeight: number
    widowCount: number
    boxes: JustifiedLayoutBox[]
  }
  export default function justifiedLayout(
    input: number[] | { width: number; height: number }[],
    config?: JustifiedLayoutOptions,
  ): JustifiedLayoutResult
}
