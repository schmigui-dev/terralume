import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '#/components/usePrefersReducedMotion'
import { clock } from '#/features/timeline/clock'
import type { EarthquakeEvent } from '#/shared/types/geo'
import { latLonToVector } from '#/shared/utils/geo'
import { magnitudeColor, magnitudeRadius } from '#/shared/utils/magnitude'
import { HOUR } from '#/shared/utils/time'
import { useApp } from '#/stores/app'
import { dotFragment, dotVertex, ringFragment, ringVertex } from './markerShaders'

const SURFACE = 1.003
const RECENT_WINDOW_S = (6 * HOUR) / 1000
const HIT_MIN_RADIUS = 0.014

interface Props {
  events: EarthquakeEvent[]
}

export function EarthquakeMarkers({ events }: Props) {
  const dots = useRef<THREE.InstancedMesh>(null)
  const hits = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)
  const dotMat = useRef<THREE.ShaderMaterial>(null)
  const ringMat = useRef<THREE.ShaderMaterial>(null)
  const camera = useThree((s) => s.camera)
  const select = useApp((s) => s.select)
  const hover = useApp((s) => s.hover)
  const reducedMotion = usePrefersReducedMotion()
  const count = events.length
  // Times are uploaded relative to a base so float32 keeps sub-second precision.
  const baseTime = count ? events[0].time : 0

  const selection = useRef({ selected: -1, hovered: -1 })
  const indexById = useMemo(() => new Map(events.map((e, i) => [e.id, i])), [events])

  const attributes = useMemo(() => {
    const color = new Float32Array(count * 3)
    const time = new Float32Array(count)
    const index = new Float32Array(count)
    const c = new THREE.Color()
    events.forEach((e, i) => {
      c.set(magnitudeColor(e.properties.magnitude))
      c.toArray(color, i * 3)
      time[i] = (e.time - baseTime) / 1000
      index[i] = i
    })
    return { color, time, index }
  }, [events, count, baseTime])

  const uniforms = useMemo(
    () => ({
      dots: { uNow: { value: 0 }, uSelected: { value: -1 }, uHovered: { value: -1 } },
      rings: { uNow: { value: 0 }, uWall: { value: 0 }, uRecentWindow: { value: RECENT_WINDOW_S }, uMotion: { value: 1 } },
    }),
    [],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 0, 1)
    const pos = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const s = new THREE.Vector3()
    events.forEach((e, i) => {
      const [x, y, z] = latLonToVector(e.position.latitude, e.position.longitude, SURFACE)
      pos.set(x, y, z)
      normal.copy(pos).normalize()
      q.setFromUnitVectors(up, normal)
      const r = magnitudeRadius(e.properties.magnitude)
      m.compose(pos, q, s.setScalar(r))
      dots.current?.setMatrixAt(i, m)
      m.compose(pos, q, s.setScalar(Math.max(r * 2.2, HIT_MIN_RADIUS)))
      hits.current?.setMatrixAt(i, m)
      m.compose(pos.clone().multiplyScalar(1.0005), q, s.setScalar(r * 9))
      rings.current?.setMatrixAt(i, m)
    })
    for (const mesh of [dots.current, hits.current, rings.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [events])

  // Selection/hover → uniforms without re-rendering the scene graph.
  useEffect(
    () =>
      useApp.subscribe((s) => {
        selection.current.selected = s.selectedEventId ? (indexById.get(s.selectedEventId) ?? -1) : -1
        selection.current.hovered = s.hoveredEventId ? (indexById.get(s.hoveredEventId) ?? -1) : -1
      }),
    [indexById],
  )

  // R3F/three keep their own uniform wrappers, so always write through the live material.
  useFrame((state) => {
    const now = (clock.getState().currentTime - baseTime) / 1000
    const d = dotMat.current?.uniforms
    if (d) {
      d.uNow.value = now
      d.uSelected.value = selection.current.selected
      d.uHovered.value = selection.current.hovered
    }
    const r = ringMat.current?.uniforms
    if (r) {
      r.uNow.value = now
      r.uWall.value = state.clock.elapsedTime
      r.uMotion.value = reducedMotion ? 0 : 1
    }
  })

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>): EarthquakeEvent | null => {
    if (e.instanceId == null) return null
    const ev = events[e.instanceId]
    if (!ev || ev.time > clock.getState().currentTime) return null
    // Ignore markers on the far side of the planet.
    const toCam = camera.position.clone().sub(e.point).normalize()
    if (e.point.clone().normalize().dot(toCam) < 0.05) return null
    return ev
  }

  if (!count) return null

  return (
    <group>
      <instancedMesh ref={rings} args={[undefined, undefined, count]} raycast={() => null} renderOrder={3} frustumCulled={false}>
        <planeGeometry args={[1, 1]}>
          <instancedBufferAttribute attach="attributes-aColor" args={[attributes.color, 3]} />
          <instancedBufferAttribute attach="attributes-aTime" args={[attributes.time, 1]} />
          <instancedBufferAttribute attach="attributes-aIndex" args={[attributes.index, 1]} />
        </planeGeometry>
        <shaderMaterial
          ref={ringMat}
          vertexShader={ringVertex}
          fragmentShader={ringFragment}
          uniforms={uniforms.rings}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      <instancedMesh ref={dots} args={[undefined, undefined, count]} raycast={() => null} renderOrder={4} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]}>
          <instancedBufferAttribute attach="attributes-aColor" args={[attributes.color, 3]} />
          <instancedBufferAttribute attach="attributes-aTime" args={[attributes.time, 1]} />
          <instancedBufferAttribute attach="attributes-aIndex" args={[attributes.index, 1]} />
        </sphereGeometry>
        <shaderMaterial ref={dotMat} vertexShader={dotVertex} fragmentShader={dotFragment} uniforms={uniforms.dots} />
      </instancedMesh>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: three.js object, not DOM; EventList is the accessible path */}
      <instancedMesh
        ref={hits}
        args={[undefined, undefined, count]}
        onPointerMove={(e) => {
          const ev = pick(e)
          if (!ev) return
          e.stopPropagation()
          hover(ev.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          const ev = pick(e)
          if (!ev) return
          e.stopPropagation()
          select(ev.id)
        }}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
