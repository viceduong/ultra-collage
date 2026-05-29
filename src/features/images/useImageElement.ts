import { useEffect, useState } from 'react'

/**
 * Loads an HTMLImageElement from a url for use as a Konva image source.
 * Mirrors react-konva's `use-image` hook but kept local to avoid an extra dep
 * and to give us explicit crossOrigin handling for export.
 */
export function useImageElement(url: string | undefined): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>()

  useEffect(() => {
    if (!url) {
      setImage(undefined)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    let active = true
    img.onload = () => {
      if (active) setImage(img)
    }
    img.src = url
    return () => {
      active = false
    }
  }, [url])

  return image
}
