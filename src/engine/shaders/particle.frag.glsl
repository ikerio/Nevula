varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;
uniform float uOpacity;
uniform float uBlendFade;
uniform vec3  uFogColor;
uniform float uFogDensity;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  // Solid-body dot with soft rim. pow(core, 0.55) gives a near-flat opaque
  // interior; the rim still feathers so dots overlap cleanly.
  float core = smoothstep(0.5, 0.0, d);
  // uOpacity = external setOpacity (user); uBlendFade = internal blending
  // crossfade; vAlpha = per-particle alpha (used by the logo state's
  // wireframe trail particles to fade in/out cleanly).
  float a = pow(core, 0.55) * uOpacity * uBlendFade * vAlpha;

  // FogExp2: 1 - exp(-density^2 * depth^2). Disabled when uFogDensity == 0.
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  vec3 color = mix(vColor, uFogColor, fogFactor);

  gl_FragColor = vec4(color, a);
}
