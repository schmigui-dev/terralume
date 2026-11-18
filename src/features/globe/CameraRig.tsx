import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { type ComponentRef, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '#/components/usePrefersReducedMotion'
import { clock } from '#/features/timeline/clock'
import type { EarthquakeEvent } from '#/shared/types/geo'
import { latLonToVector } from '#/shared/utils/geo'
import { subsolarPoint } from '#/shared/utils/solar'
import { useApp } from '#/stores/app'

const HOME_DISTANCE = 4.4

/** Home view looks at the sunlit side with the terminator on the right — the most cinematic framing. */
function homePosition(aspect: number): THREE.Vector3 {
  const { lon } = subsolarPoint(clock.getState().currentTime)
  // Portrait screens: back off so the planet fits the narrow horizontal field of view.
  const distance = HOME_DISTANCE * Math.max(1, 0.8 / aspect)
  return new THREE.Vector3(...latLonToVector(22, lon - 50, distance))
}
const FOCUS_DISTANCE = 2.1

interface Flight {
  from: THREE.Vector3
  to: THREE.Vector3
  t: number
  duration: number
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Interpolates along the sphere (slerp direction, lerp distance) so flights arc around the planet. */
function sphericalLerp(from: THREE.Vector3, to: THREE.Vector3, t: number, out: THREE.Vector3) {
  const a = from.clone().normalize()
  const b = to.clone().normalize()
  const angle = a.angleTo(b)
  const dist = THREE.MathUtils.lerp(from.length(), to.length(), t)
  if (angle < 1e-4) return out.copy(a).multiplyScalar(dist)
  const axis = new THREE.Vector3().crossVectors(a, b)
  if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0)
  axis.normalize()
  return out
    .copy(a)
    .applyAxisAngle(axis, angle * t)
    .multiplyScalar(dist)
}

export function CameraRig({ events }: { events: EarthquakeEvent[] }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / Math.max(s.size.height, 1))
  const flight = useRef<Flight | null>(null)
  const interacted = useRef(false)
  const reducedMotion = usePrefersReducedMotion()
  const selectedId = useApp((s) => s.selectedEventId)
  const resetToken = useApp((s) => s.resetToken)

  const flyTo = (to: THREE.Vector3, duration: number) => {
    if (reducedMotion) {
      camera.position.copy(to)
      controls.current?.update()
      return
    }
    flight.current = { from: camera.position.clone(), to, t: 0, duration }
  }

  // Cinematic intro
  useEffect(() => {
    const home = homePosition(aspect)
    const start = home
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.9)
      .multiplyScalar(2.2)
    camera.position.copy(reducedMotion ? home : start)
    if (!reducedMotion) flight.current = { from: start, to: home, t: 0, duration: 3.6 }
  }, [camera, reducedMotion])

  useEffect(() => {
    if (resetToken === 0) return
    interacted.current = false
    flyTo(homePosition(aspect), 1.6)
  }, [resetToken])

  useEffect(() => {
    if (!selectedId) return
    const ev = events.find((e) => e.id === selectedId)
    if (!ev) return
    interacted.current = true
    const dist = Math.min(camera.position.length(), FOCUS_DISTANCE + 0.6)
    flyTo(new THREE.Vector3(...latLonToVector(ev.position.latitude, ev.position.longitude, Math.max(dist, FOCUS_DISTANCE))), 1.4)
  }, [selectedId, events])

  useFrame((_, delta) => {
    const c = controls.current
    const f = flight.current
    if (f) {
      f.t = Math.min(f.t + delta / f.duration, 1)
      sphericalLerp(f.from, f.to, ease(f.t), camera.position)
      if (f.t >= 1) flight.current = null
    }
    if (c) {
      c.autoRotate = !reducedMotion && !interacted.current && !flight.current
      // Slower rotation when zoomed in
      c.rotateSpeed = THREE.MathUtils.clamp((camera.position.length() - 1) * 0.35, 0.08, 0.8)
      c.update()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.25}
      maxDistance={18}
      autoRotateSpeed={0.35}
      zoomSpeed={0.6}
      onStart={() => {
        interacted.current = true
        flight.current = null
      }}
    />
  )
}
