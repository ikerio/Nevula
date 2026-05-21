attribute float aSize;
attribute float aAlpha;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;
uniform float uSize;
uniform float uPixelRatio;
void main() {
  vColor = color;
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vFogDepth = -mvPosition.z;
  gl_PointSize = uSize * aSize * uPixelRatio * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
