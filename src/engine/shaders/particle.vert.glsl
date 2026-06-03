attribute float aSize;
attribute float aAlpha;
attribute float aSeed;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;
varying float vTw;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTime;
uniform float uTwinkle;
void main() {
  vColor = color;
  vAlpha = aAlpha;
  // Per-particle scintillation — individual phase + rate via the seed.
  float tw = 0.5 + 0.5 * sin(uTime * (0.7 + aSeed * 1.7) + aSeed * 6.2831);
  vTw = mix(1.0, tw, uTwinkle);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vFogDepth = -mvPosition.z;
  // Twinkle nudges size a touch too, so highlights "breathe".
  float sizeMul = mix(1.0, 0.78 + 0.44 * tw, uTwinkle);
  gl_PointSize = uSize * aSize * sizeMul * uPixelRatio * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
