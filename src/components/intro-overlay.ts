import gsap from 'gsap'
import { htmlEl } from '../lib/dom'
import nevulaTextSvg from '../assets/NevulaText.svg?raw'
import { mountIntroAtmospherics } from './intro-atmospherics'
import { mountNetworkHorizon, type NetworkHorizonHandle } from './intro-network-horizon'
import '../styles/intro-overlay.css'

export interface IntroOverlay {
  /** Tear down the overlay (remove DOM, cancel listeners + timers). */
  dispose(): void
}

export interface IntroOverlayOptions {
  /** Fires as soon as the user triggers the exit (first wheel/touch/key/click).
   *  Caller should start ramping the particle field's uOpacity here. */
  onExitBegin: () => void
  /** Fires once the exit transition has finished (~1.25s after onExitBegin).
   *  Caller should dispose the overlay and let chapter 0 surface naturally. */
  onExitComplete: () => void
}

/** Delay after mount before the scroll hint pulses in (ms). Lined up so it
 *  lands just after the last letter ("a") finishes revealing. */
const HINT_DELAY_MS = 2900

/** Duration (sec) of the wordmark particle-disintegration dissolve. The
 *  particle field intentionally does NOT start emerging until this window
 *  finishes — the wordmark must be fully gone before the particle V appears,
 *  per user direction. */
export const DISSOLVE_DURATION = 1.3
/** Peak grain-displacement (user-space units) at the end of the dissolve.
 *  Paired with the high-freq fractal noise (0.42), this scatters individual
 *  pixels a handful of rendered px — particle jitter, not the letter-wide
 *  smear that produced the earlier ripple look. Bumped from 55 so particles
 *  travel farther outward before vanishing — less sudden, more drifting. */
const DISSOLVE_GRAIN_PEAK = 110
/** Peak ripple-displacement (user-space units). Paired with the low-freq
 *  turbulence (0.013), this bends the wordmark silhouette as a whole on
 *  smooth wavy paths, on top of which the grain-displacement scatters
 *  individual pixels — so the particles flow along ripple curves rather
 *  than each pixel scattering in isolation. Bumped from 90 so the wave
 *  deformation reads clearly through the dissolve. */
const DISSOLVE_RIPPLE_PEAK = 175
/** Final value of feFuncA@intercept at the end of the dissolve. With slope
 *  fixed at 15, sweeping intercept 0 → -16 walks the alpha threshold across
 *  the noise [0,1] range, erasing pixels in noise-shaped chunks. */
const DISSOLVE_INTERCEPT_END = -16
/** Identity matrix for the wash feColorMatrix — at this state the wash is
 *  a visual no-op (R'=R, G'=G, B'=B, A'=A). The dissolve animation walks
 *  the matrix values from this toward WASH_TARGET as it progresses. */
const WASH_IDENTITY: readonly number[] = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
]
/** End state for the wash matrix — every RGB channel collapses to the
 *  silver page background (#e6e8ef ≈ 0.90/0.91/0.94). At this state the
 *  surviving particles are exactly the page color (invisible). Intermediate
 *  frames interpolate, which compresses contrast AND lifts brightness AND
 *  desaturates all at once — much cleaner than chaining three separate
 *  feColorMatrix/feComponentTransfer primitives. */
const WASH_TARGET: readonly number[] = [
  0, 0, 0, 0, 0.90,
  0, 0, 0, 0, 0.91,
  0, 0, 0, 0, 0.94,
  0, 0, 0, 1, 0,
]
/** Stringify a 20-number matrix into the space-separated form
 *  feColorMatrix expects in its `values` attribute. */
function matrixToString(m: readonly number[]): string {
  return m.join(' ')
}
/** Tail after the dissolve finishes before the overlay is removed from the
 *  DOM. Gives the particle field room to fade in cleanly underneath. */
const DISSOLVE_TAIL_MS = 760

const SVG_NS = 'http://www.w3.org/2000/svg'
const DISSOLVE_FILTER_ID = 'nv-dissolve'

/**
 * Annotate the NevulaText SVG so each child of the outer wordmark group
 * becomes an animatable `.intro-letter`. data-order assigns the reveal
 * sequence — file order is a, l, u, V, e, n (right→left) so we reverse to
 * get the natural left→right reading order: n=0, e=1, V=2, u=3, l=4, a=5.
 *
 * Critically, each child is WRAPPED in a new outer `<g>` — applying the
 * `intro-letter` class directly to the existing group would mean our CSS
 * `transform` rules (translate/scale) override the SVG `transform="matrix(...)"`
 * attribute that positions each letter within the wordmark, stacking them
 * all at origin. The wrapper has no `transform` attribute, so CSS-driven
 * transforms compose cleanly on top of the inner positioning matrix.
 *
 * Also injects the `<defs><filter id="nv-dissolve">` element used by the
 * exit animation. The filter is applied via CSS so it's always in the
 * render chain; at scale=0 it's a visual no-op.
 */
function buildWordmarkSvg(): SVGSVGElement {
  const parser = new DOMParser()
  const doc = parser.parseFromString(nevulaTextSvg, 'image/svg+xml')
  const svg = doc.documentElement as unknown as SVGSVGElement

  // Ripple-over-particle dissolve filter. Two noise fields, two
  // displacement passes, a color wash, and an alpha threshold mask:
  //
  //   • `wave`  — type="turbulence" + LOW baseFrequency = a few large
  //               sinusoidal cells across the SVG. Drives the ripple
  //               distortion that bends the wordmark's silhouette like
  //               a flag rippling.
  //   • `grain` — type="fractalNoise" + HIGH baseFrequency = sub-pixel
  //               cells. Drives both the per-pixel jitter (so the rippled
  //               shape itself looks particulated) and the alpha mask
  //               (chunks of pixels vanish in noise-shaped clumps).
  //   • `wash`  — feColorMatrix in "matrix" mode, animated from identity
  //               toward an all-silver target. As it walks, the matrix
  //               compresses every channel toward the page background
  //               color so surviving particles desaturate and lift in
  //               brightness while losing contrast — they wash into the
  //               silver rather than reading as high-saturation specks.
  //               (CSS `filter: saturate()/brightness()/contrast()` via
  //               var() interpolation turned out to be flaky — some
  //               browsers don't re-evaluate the filter chain when only
  //               the `var()` source changes mid-animation. Doing it
  //               inside the SVG filter graph is rock-solid because the
  //               graph re-runs every frame regardless.)
  //
  // Composition: SourceGraphic → wash → ripple displace → grain displace
  //              → composite-in with grain-derived alpha mask.
  //
  // feDisplacementMap and feColorMatrix elements are tagged with
  // `data-role` so the exit animation can locate each one independently.
  const defs = document.createElementNS(SVG_NS, 'defs')
  defs.innerHTML = [
    `<filter id="${DISSOLVE_FILTER_ID}" x="-50%" y="-50%" width="200%" height="200%">`,
    `  <feTurbulence type="turbulence"   baseFrequency="0.013" numOctaves="2" seed="3" result="wave"/>`,
    `  <feTurbulence type="fractalNoise" baseFrequency="0.42"  numOctaves="2" seed="9" result="grain"/>`,
    `  <feColorMatrix data-role="wash" in="SourceGraphic" type="matrix" values="${WASH_IDENTITY}" result="washed"/>`,
    `  <feDisplacementMap data-role="ripple" in="washed"  in2="wave"  scale="0" xChannelSelector="R" yChannelSelector="G" result="rippled"/>`,
    `  <feDisplacementMap data-role="grain"  in="rippled" in2="grain" scale="0" xChannelSelector="R" yChannelSelector="G" result="jittered"/>`,
    `  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="grainAlpha"/>`,
    `  <feComponentTransfer in="grainAlpha" result="erodeMask">`,
    `    <feFuncA type="linear" slope="15" intercept="0"/>`,
    `  </feComponentTransfer>`,
    `  <feComposite in="jittered" in2="erodeMask" operator="in"/>`,
    `</filter>`,
  ].join('')
  svg.insertBefore(defs, svg.firstChild)

  const wordmark = svg.querySelector('#NevulaLogo')
  if (wordmark) {
    const children = Array.from(wordmark.children) as SVGElement[]
    const total = children.length
    children.forEach((child, i) => {
      const wrapper = document.createElementNS(SVG_NS, 'g')
      wrapper.classList.add('intro-letter')
      // file order (a, l, u, V, e, n) → reverse to (n, e, V, u, l, a)
      wrapper.setAttribute('data-order', String(total - 1 - i))
      if (child.id === 'Logo') wrapper.classList.add('text-logo')
      wordmark.replaceChild(wrapper, child)
      wrapper.appendChild(child)
    })
  }

  return document.importNode(svg, true) as SVGSVGElement
}

export function mountIntroOverlay(opts: IntroOverlayOptions): IntroOverlay {
  const overlay = htmlEl(`
    <div class="intro-overlay" aria-hidden="true">
      <div class="intro-welcome">Welcome to</div>
      <div class="intro-wordmark"></div>
      <div class="intro-hint">
        <span>Scroll to begin</span>
        <span class="line"></span>
      </div>
    </div>
  `)

  // Ambient geometry (orbits / grid / constellation / plus marks) goes
  // BEHIND the wordmark — inserted at the top of the overlay so the
  // natural stacking order puts it under .intro-wordmark.
  overlay.insertBefore(mountIntroAtmospherics(), overlay.firstChild)

  // Three.js network horizon — sits BETWEEN the SVG atmospherics and the
  // wordmark. Renders a quiet hemisphere of nodes + connections + lifting
  // particles behind the brand mark. Mounted as a sibling after atmospherics
  // (so it stacks above SVG but below the wordmark — wordmark is appended
  // separately to its own host below).
  const horizon: NetworkHorizonHandle = mountNetworkHorizon()
  overlay.insertBefore(horizon.el, overlay.querySelector('.intro-wordmark'))

  const wordmarkHost = overlay.querySelector('.intro-wordmark')!
  const svgEl = buildWordmarkSvg()
  wordmarkHost.appendChild(svgEl)

  document.body.appendChild(overlay)

  // Prevent native scrolling while the intro is in place. The exit handler
  // is what hands off to the scroll engine.
  const prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  // Trigger entrance animation. Double-RAF (not single) is the fix: on a
  // soft refresh the stylesheet is cached and Vite injects it almost
  // instantly, so a single RAF schedules `is-mounted` in the very same
  // frame as the element's first paint — the browser then computes both
  // states together and skips the transition. The intermediate RAF
  // guarantees the initial styles paint first, so the transition has a
  // distinct "from" state to animate out of.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-mounted')
    })
  })

  const hintTimer = window.setTimeout(() => {
    overlay.classList.add('show-hint')
  }, HINT_DELAY_MS)

  let exiting = false
  let exitTimer = 0

  const beginExit = (e?: Event): void => {
    if (exiting) return
    e?.preventDefault()
    exiting = true
    overlay.classList.add('is-exiting')
    opts.onExitBegin()

    // Wordmark particle disintegration — five parallel tweens drive the
    // ripple-over-particle filter pipeline plus a color wash:
    //   • ripple displacement scale  0 → DISSOLVE_RIPPLE_PEAK   (wavy bend)
    //   • grain  displacement scale  0 → DISSOLVE_GRAIN_PEAK    (jitter)
    //   • feFuncA@intercept          0 → DISSOLVE_INTERCEPT_END (mask sweep)
    //   • CSS filter chain (vars)    saturate/bright/contrast wash toward
    //                                silver — particles desaturate and
    //                                lift toward the page background so
    //                                they don't read as high-contrast
    //                                specks at the end of the dissolve.
    //   • SVG opacity tail           1 → 0 over the last 45%    (back-stop)
    // Ripple uses a softer easing (power1) so the wave starts earlier and
    // is visible during the bulk of the dissolve. Grain + mask + wash use
    // a sharper easing (power2) so the particle erosion accelerates toward
    // the end — feels like the wordmark "lets go" rather than steadily
    // shrinking.
    const ripple = svgEl.querySelector('feDisplacementMap[data-role="ripple"]')
    const grain = svgEl.querySelector('feDisplacementMap[data-role="grain"]')
    const funcA = svgEl.querySelector('feFuncA')
    if (ripple) {
      gsap.to(ripple, {
        attr: { scale: DISSOLVE_RIPPLE_PEAK },
        duration: DISSOLVE_DURATION,
        ease: 'power1.in',
      })
    }
    if (grain) {
      gsap.to(grain, {
        attr: { scale: DISSOLVE_GRAIN_PEAK },
        duration: DISSOLVE_DURATION,
        ease: 'power2.in',
      })
    }
    if (funcA) {
      gsap.to(funcA, {
        attr: { intercept: DISSOLVE_INTERCEPT_END },
        duration: DISSOLVE_DURATION,
        ease: 'power1.in',
      })
    }
    // Color wash via the feColorMatrix in the SVG filter pipeline.
    // Tween a proxy `t` 0→1 and rebuild the matrix string each frame so
    // every cell interpolates from identity toward the all-silver target.
    // Doing it via an onUpdate (instead of GSAP attr animation on the
    // values string directly) sidesteps GSAP's number-token parsing for
    // a 20-value string, which can split unpredictably.
    const wash = svgEl.querySelector('feColorMatrix[data-role="wash"]')
    if (wash) {
      const t = { v: 0 }
      gsap.to(t, {
        v: 1,
        duration: DISSOLVE_DURATION,
        ease: 'power2.in',
        onUpdate: () => {
          const lerped = WASH_IDENTITY.map((a, i) => a + (WASH_TARGET[i] - a) * t.v)
          wash.setAttribute('values', matrixToString(lerped))
        },
      })
    }
    gsap.to(svgEl, {
      opacity: 0,
      duration: DISSOLVE_DURATION * 0.45,
      delay: DISSOLVE_DURATION * 0.55,
      ease: 'power2.in',
    })

    // Drive the horizon's own internal opacity ramp to zero in parallel
    // with the CSS opacity transition. The component multiplies its
    // uOpacity by the CSS opacity, so this gives a clean fade.
    horizon.fadeOut(DISSOLVE_DURATION * 1000 * 0.7).catch(() => {})

    exitTimer = window.setTimeout(() => {
      overlay.classList.add('is-exited')
      opts.onExitComplete()
    }, DISSOLVE_DURATION * 1000 + DISSOLVE_TAIL_MS)
  }

  const onWheel = (e: Event): void => beginExit(e)
  const onTouch = (e: Event): void => beginExit(e)
  const onClick = (e: Event): void => beginExit(e)
  const onKey = (e: KeyboardEvent): void => {
    // Only treat advancement-style keys as the exit trigger. Modifier-only
    // taps (Shift, Ctrl, Alt) and meta should not skip the intro.
    if (
      e.key === 'ArrowDown' || e.key === 'PageDown' ||
      e.key === 'ArrowRight' || e.key === ' ' ||
      e.key === 'Enter' || e.key === 'End'
    ) beginExit(e)
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouch, { passive: false })
  window.addEventListener('click', onClick)
  window.addEventListener('keydown', onKey)

  return {
    dispose(): void {
      window.clearTimeout(hintTimer)
      window.clearTimeout(exitTimer)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      horizon.dispose()
      overlay.remove()
    },
  }
}
