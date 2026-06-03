varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;
varying float vTw;
uniform float uOpacity;
uniform float uBlendFade;
uniform vec3  uFogColor;
uniform float uFogDensity;
uniform float uGlow;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  // Crisp opaque body with screen-space-derivative AA on the rim — keeps small
  // dots sharp even with antialias:false on the renderer. pow(.,0.55) keeps the
  // near-flat opaque interior the dense states (logo/city) rely on.
  float aa = fwidth(d) * 1.4;
  float body = 1.0 - smoothstep(0.30 - aa, 0.30 + aa, d);
  body = pow(body, 0.55);
  // Soft exponential halo gives each particle its own light, so we lean less on
  // bloom (which otherwise clips bright clusters to peach/white).
  float halo = exp(-d * 6.5) * uGlow;
  // uOpacity = external setOpacity (user); uBlendFade = blending crossfade;
  // vAlpha = per-particle alpha (logo trails); vTw = per-particle twinkle.
  float a = (body + halo) * uOpacity * uBlendFade * vAlpha * vTw;
  a = clamp(a, 0.0, 1.0);

  // FogExp2: 1 - exp(-density^2 * depth^2). Disabled when uFogDensity == 0.
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  vec3 color = mix(vColor, uFogColor, fogFactor);

  gl_FragColor = vec4(color, a);
}
