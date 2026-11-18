import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Quality } from '#/stores/app'

export interface EarthTextureSet {
  day: string
  night: string
  /** R = bump, G = roughness, B = clouds */
  brc: string
}

const set = (size: 2048 | 4096): EarthTextureSet => ({
  day: `/textures/earth_day_${size}.jpg`,
  night: `/textures/earth_night_${size}.jpg`,
  brc: `/textures/earth_bump_roughness_clouds_${size}.jpg`,
})

/** 4K only in high quality; low quality (default on phones / touch) uses 2K. */
export const TEXTURE_SETS: Record<Quality, EarthTextureSet> = { high: set(4096), low: set(2048) }

export interface EarthTextures {
  quality: Quality
  day: THREE.Texture
  night: THREE.Texture
  brc: THREE.Texture
}

async function loadSet(urls: EarthTextureSet, gl: THREE.WebGLRenderer): Promise<Omit<EarthTextures, 'quality'>> {
  const loader = new THREE.TextureLoader()
  const [day, night, brc] = await Promise.all([
    loader.loadAsync(urls.day),
    loader.loadAsync(urls.night),
    loader.loadAsync(urls.brc),
  ])
  const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
  for (const t of [day, night]) t.colorSpace = THREE.SRGBColorSpace
  for (const t of [day, night, brc]) t.anisotropy = aniso
  return { day, night, brc }
}

function dispose(t: EarthTextures | null) {
  if (!t) return
  t.day.dispose()
  t.night.dispose()
  t.brc.dispose()
}

/**
 * Loads only the texture set for the current quality. On a quality change the
 * previous set stays on screen until the new one is ready, then is disposed.
 */
export function useEarthTextures(quality: Quality): { textures: EarthTextures | null; error: Error | null } {
  const gl = useThree((s) => s.gl)
  const [textures, setTextures] = useState<EarthTextures | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const current = useRef<EarthTextures | null>(null)

  useEffect(() => {
    if (current.current?.quality === quality) return
    let cancelled = false
    loadSet(TEXTURE_SETS[quality], gl).then(
      (loaded) => {
        if (cancelled) {
          dispose({ quality, ...loaded })
          return
        }
        const previous = current.current
        current.current = { quality, ...loaded }
        setTextures(current.current)
        // Let React commit the swap before freeing GPU memory.
        requestAnimationFrame(() => dispose(previous))
      },
      (err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Texture load failed'))
      },
    )
    return () => {
      cancelled = true
    }
  }, [quality, gl])

  useEffect(
    () => () => {
      dispose(current.current)
      current.current = null
    },
    [],
  )

  return { textures, error }
}
