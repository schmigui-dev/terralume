export const dotVertex = /* glsl */ `
attribute vec3 aColor;
attribute float aTime;
attribute float aIndex;
uniform float uNow;
uniform float uSelected;
uniform float uHovered;
varying vec3 vColor;
varying float vAlpha;
varying float vHighlight;
varying vec3 vNormalV;
void main() {
  float visible = step(aTime, uNow);
  // Fresh events (in simulated time) pop slightly larger
  float age = max(uNow - aTime, 0.0);
  float fresh = exp(-age / 1800.0);
  float hl = max(step(abs(aIndex - uSelected), 0.5), step(abs(aIndex - uHovered), 0.5) * 0.6);
  float scale = visible * (1.0 + fresh * 0.6 + hl * 0.3);
  vec3 p = position * scale;
  vColor = aColor;
  vAlpha = visible;
  vHighlight = hl;
  vNormalV = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
`

export const dotFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vHighlight;
varying vec3 vNormalV;
void main() {
  if (vAlpha < 0.5) discard;
  float facing = clamp(vNormalV.z, 0.0, 1.0);
  vec3 col = vColor * (0.65 + 0.6 * facing) + vec3(1.0) * vHighlight * 0.35;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export const ringVertex = /* glsl */ `
attribute vec3 aColor;
attribute float aTime;
attribute float aIndex;
uniform float uNow;
varying vec2 vUv;
varying vec3 vColor;
varying float vAge;
varying float vSeed;
void main() {
  vUv = uv;
  vColor = aColor;
  vAge = uNow - aTime;
  vSeed = aIndex;
  float visible = step(aTime, uNow);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position * visible, 1.0);
}
`

/** Illustrative pulse — NOT a seismic wave model. */
export const ringFragment = /* glsl */ `
uniform float uWall;
uniform float uRecentWindow;
uniform float uMotion;
varying vec2 vUv;
varying vec3 vColor;
varying float vAge;
varying float vSeed;
void main() {
  if (vAge < 0.0 || vAge > uRecentWindow) discard;
  float r = length(vUv - 0.5) * 2.0;
  if (r > 1.0) discard;
  float recency = 1.0 - vAge / uRecentWindow;
  float phase = fract(uWall * 0.45 + fract(vSeed * 0.618)) * uMotion + (1.0 - uMotion) * 0.6;
  float ring = smoothstep(0.07, 0.0, abs(r - phase)) * (1.0 - phase);
  float halo = smoothstep(1.0, 0.0, r) * 0.08;
  float a = (ring + halo) * recency;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}
`
