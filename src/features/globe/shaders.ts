export const earthVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const earthFragment = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uBumpRoughClouds;
uniform vec3 uSunDir;
uniform float uCloudShadow;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  vec3 L = normalize(uSunDir);
  float ndl = dot(N, L);

  vec3 day = texture2D(uDay, vUv).rgb;
  vec3 night = texture2D(uNight, vUv).rgb;
  vec3 brc = texture2D(uBumpRoughClouds, vUv).rgb;
  float roughness = brc.g;
  float clouds = brc.b;

  // Soft terminator (civil twilight ~6°)
  float dayMix = smoothstep(-0.1, 0.18, ndl);

  vec3 lit = day * (0.06 + 1.05 * max(ndl, 0.0));
  lit *= 1.0 - clouds * uCloudShadow * 0.35 * dayMix;

  // Ocean glint: low roughness ≈ water
  float water = 1.0 - smoothstep(0.25, 0.6, roughness);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 60.0) * water * 0.55 * smoothstep(0.0, 0.2, ndl);
  lit += vec3(1.0, 0.92, 0.8) * spec;

  // City lights, faded near terminator and under clouds
  vec3 cities = pow(night, vec3(1.4)) * vec3(1.6, 1.25, 0.85) * (1.0 - clouds * 0.6);
  vec3 color = mix(cities, lit, dayMix);

  // Atmospheric rim tint on the day side
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 rimDay = vec3(0.35, 0.6, 1.0);
  vec3 rimTwilight = vec3(1.0, 0.45, 0.2);
  float twilight = 1.0 - abs(ndl * 2.4);
  vec3 rim = mix(rimDay, rimTwilight, clamp(twilight, 0.0, 1.0) * 0.6);
  color += rim * fres * smoothstep(-0.25, 0.5, ndl) * 0.55;

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const cloudFragment = /* glsl */ `
uniform sampler2D uBumpRoughClouds;
uniform vec3 uSunDir;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 N = normalize(vNormalW);
  float ndl = dot(N, normalize(uSunDir));
  float c = texture2D(uBumpRoughClouds, vUv).b;
  c = smoothstep(0.15, 0.9, c);
  float light = smoothstep(-0.15, 0.35, ndl);
  vec3 col = mix(vec3(0.02, 0.03, 0.06), vec3(1.0), light);
  gl_FragColor = vec4(col, c * uOpacity * (0.25 + 0.75 * light));
  #include <colorspace_fragment>
}
`

export const atmosphereVertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const atmosphereFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform float uLimb; // |dot(V,N)| on the shell where it grazes the planet surface
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  // Back faces: d = 0 at the shell's silhouette, = uLimb at the planet's limb.
  float d = clamp(-dot(V, N), 0.0, 1.0);
  float glow = pow(smoothstep(0.0, uLimb, d), 2.4);
  float sun = dot(N, normalize(uSunDir));
  float day = smoothstep(-0.3, 0.5, sun);
  float twilight = 1.0 - smoothstep(0.0, 0.35, abs(sun));
  vec3 col = mix(vec3(0.08, 0.14, 0.4), vec3(0.32, 0.62, 1.0), day);
  col = mix(col, vec3(1.0, 0.52, 0.28), twilight * 0.4);
  float alpha = glow * (0.08 + 0.92 * day);
  gl_FragColor = vec4(col * alpha * 1.4, alpha);
  #include <colorspace_fragment>
}
`
