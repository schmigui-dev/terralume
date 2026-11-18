import { AdaptiveDpr, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { EarthquakeMarkers } from '#/features/layers/earthquakes/EarthquakeMarkers'
import type { EarthquakeEvent } from '#/shared/types/geo'
import { useApp } from '#/stores/app'
import { CameraRig } from './CameraRig'
import { Earth } from './Earth'

interface Props {
  events: EarthquakeEvent[]
  onReady?: () => void
  onContextLost?: () => void
  onTextureError?: (e: Error) => void
}

export default function Scene({ events, onReady, onContextLost, onTextureError }: Props) {
  const quality = useApp((s) => s.quality)
  const quakesOn = useApp((s) => s.layers.earthquakes)
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={quality === 'high' ? [1, 2] : [0.75, 1]}
      camera={{ fov: 38, near: 0.05, far: 200, position: [0, 0, 8] }}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={(state) => {
        const { gl } = state
        if (import.meta.env.DEV) (window as unknown as { __r3f: unknown }).__r3f = state
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost?.()
        })
      }}
      onPointerMissed={() => useApp.getState().select(null)}
      aria-hidden
    >
      <color attach="background" args={['#020308']} />
      <Stars radius={60} depth={40} count={quality === 'high' ? 5000 : 1500} factor={2.2} saturation={0} fade speed={0} />
      <Earth onReady={onReady} onError={onTextureError} />
      {quakesOn && <EarthquakeMarkers events={events} />}
      <CameraRig events={events} />
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  )
}
