import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clock } from '#/features/timeline/clock'
import { latLonToVector } from '#/shared/utils/geo'
import { subsolarPoint } from '#/shared/utils/solar'
import { useApp } from '#/stores/app'
import { atmosphereFragment, atmosphereVertex, cloudFragment, earthFragment, earthVertex } from './shaders'

export const TEXTURES = {
  day: '/textures/earth_day_4096.jpg',
  night: '/textures/earth_night_4096.jpg',
  brc: '/textures/earth_bump_roughness_clouds_4096.jpg',
}

const CLOUD_RADIUS = 1.008
const ATMOSPHERE_RADIUS = 1.045

/** Shared sun direction; updated once per frame from the authoritative clock. */
export const sunDirection = new THREE.Vector3(1, 0, 0)

export function Earth() {
  const quality = useApp((s) => s.quality)
  const cloudsOn = useApp((s) => s.layers.clouds)
  const gl = useThree((s) => s.gl)
  const [day, night, brc] = useTexture([TEXTURES.day, TEXTURES.night, TEXTURES.brc])

  useMemo(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    for (const t of [day, night]) t.colorSpace = THREE.SRGBColorSpace
    for (const t of [day, night, brc]) t.anisotropy = aniso
  }, [day, night, brc, gl])

  const segments = quality === 'high' ? 128 : 64

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
    [day, night, brc],
  )

  const earthMat = useRef<THREE.ShaderMaterial>(null)
  const cloudMat = useRef<THREE.ShaderMaterial>(null)
  const atmoMat = useRef<THREE.ShaderMaterial>(null)

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
