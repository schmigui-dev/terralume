import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clock } from '#/features/timeline/clock'
import { latLonToVector } from '#/shared/utils/geo'
import { subsolarPoint } from '#/shared/utils/solar'
import { useApp } from '#/stores/app'
import { atmosphereFragment, atmosphereVertex, cloudFragment, earthFragment, earthVertex } from './shaders'
import { useEarthTextures } from './textures'

const CLOUD_RADIUS = 1.008
const ATMOSPHERE_RADIUS = 1.045

/** Shared sun direction; updated once per frame from the authoritative clock. */
export const sunDirection = new THREE.Vector3(1, 0, 0)

export function Earth({ onReady, onError }: { onReady?: () => void; onError?: (e: Error) => void }) {
  const quality = useApp((s) => s.quality)
  const cloudsOn = useApp((s) => s.layers.clouds)
  const { textures, error } = useEarthTextures(quality)

  useEffect(() => {
    if (textures) onReady?.()
  }, [textures, onReady])
  useEffect(() => {
    if (error) onError?.(error)
  }, [error, onError])

  if (!textures) return null
  return <Planet textures={textures} cloudsOn={cloudsOn} segments={quality === 'high' ? 128 : 64} />
}

function Planet({
  textures,
  cloudsOn,
  segments,
}: {
  textures: { day: THREE.Texture; night: THREE.Texture; brc: THREE.Texture }
  cloudsOn: boolean
  segments: number
}) {
  const { day, night, brc } = textures

  const uniforms = useMemo(
    () => ({
      earth: {
        uDay: { value: day },
        uNight: { value: night },
        uBumpRoughClouds: { value: brc },
        uSunDir: { value: sunDirection.clone() },
        uCloudShadow: { value: 1 },
      },
      clouds: { uBumpRoughClouds: { value: brc }, uSunDir: { value: sunDirection.clone() }, uOpacity: { value: 0.9 } },
      atmosphere: {
        uSunDir: { value: sunDirection.clone() },
        uLimb: { value: Math.sqrt(1 - (1 / ATMOSPHERE_RADIUS) ** 2) },
      },
    }),
    // Created once; later texture swaps are written through the material refs above.
    [],
  )

  const earthMat = useRef<THREE.ShaderMaterial>(null)
  const cloudMat = useRef<THREE.ShaderMaterial>(null)
  const atmoMat = useRef<THREE.ShaderMaterial>(null)

  // Texture swaps (quality change) go through the live materials too.
  useEffect(() => {
    const e = earthMat.current?.uniforms
    if (e) {
      e.uDay.value = day
      e.uNight.value = night
      e.uBumpRoughClouds.value = brc
    }
    if (cloudMat.current) cloudMat.current.uniforms.uBumpRoughClouds.value = brc
  }, [day, night, brc])

  // R3F/three keep their own uniform wrappers, so always write through the live materials.
  useFrame(() => {
    const { lat, lon } = subsolarPoint(clock.getState().currentTime)
    const [x, y, z] = latLonToVector(lat, lon)
    sunDirection.set(x, y, z)
    for (const m of [earthMat.current, cloudMat.current, atmoMat.current]) m?.uniforms.uSunDir.value.copy(sunDirection)
    if (earthMat.current) earthMat.current.uniforms.uCloudShadow.value = cloudsOn ? 1 : 0
  })

  return (
    <group>
      <mesh name="earth">
        <sphereGeometry args={[1, segments, segments / 2]} />
        <shaderMaterial ref={earthMat} vertexShader={earthVertex} fragmentShader={earthFragment} uniforms={uniforms.earth} />
      </mesh>
      {cloudsOn && (
        <mesh raycast={() => null} renderOrder={1}>
          <sphereGeometry args={[CLOUD_RADIUS, segments, segments / 2]} />
          <shaderMaterial
            ref={cloudMat}
            vertexShader={earthVertex}
            fragmentShader={cloudFragment}
            uniforms={uniforms.clouds}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
      <mesh raycast={() => null} renderOrder={2}>
        <sphereGeometry args={[ATMOSPHERE_RADIUS, segments, segments / 2]} />
        <shaderMaterial
          ref={atmoMat}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={uniforms.atmosphere}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
