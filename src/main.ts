import './styles/reset.css'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/layout.css'
import './styles/scrims.css'

import gsap from 'gsap'
import { mountLogoSymbol } from './components/logo-mark'
import { mountCinematicOverlay } from './components/cinematic-overlay'
import { mountIntroCinematic, type IntroCinematic } from './components/intro-cinematic'
import { renderNav } from './components/nav'
import { renderChapterRail } from './components/chapter-rail'
import { renderScrollHint } from './components/scroll-hint'
import { renderAudioButton } from './components/audio-button'
import { initDemoDisclaimer, type DemoDisclaimerHandle } from './components/demo-disclaimer'
import { chapterRenderers } from './chapters'
import { initChapter1Cards, type Chapter1CardsHandle } from './chapters/ch-1'
import { initPpConsole, type PpConsoleHandle } from './chapters/ch-3-console'
import { initModularStage, type ModularStageHandle } from './chapters/ch-modular-stage'
import { initFounderChapter } from './chapters/ch-5'
import type { FounderDossierHandle } from './chapters/ch-5-dossier'
import { NevulaScroll } from './scroll/scroll-engine'
import { CHAPTERS } from './scroll/chapter-config'
import { NevulaBackground, disposeShared, type FieldHandle } from './engine'
import { isMobile } from './lib/responsive'
import { cinematicFitScale } from './lib/cinematic-fit'
import { clamp, lerp } from './lib/math'
import { preloadLogoGlb } from './engine/states/logo'
import { preloadPublicSafetyGlb } from './engine/states/public-safety'
import { preloadMicroprocessorGlb } from './engine/states/microprocessor'

// --- Mobile field backdrop ---------------------------------------------------
// On mobile the particle field is a fixed backdrop, not a per-chapter morph (see
// the mobile boot branch below). It reads prominently over the hero, then fades
// to a faint ambient texture once the user scrolls into the stacked content —
// keeping body text legible and the GPU mostly idle.
const MOBILE_HERO_OPACITY = 0.55
const MOBILE_FAINT_OPACITY = 0.12

/**
 * Reveal the field to hero opacity once the intro hands off, then drive its
 * opacity from scroll position (hero → faint) over the first ~0.8 screens.
 * Returns a disposer that detaches the scroll listener (used by HMR).
 */
function enableMobileFieldFade(field: FieldHandle): () => void {
  let active = false
  let raf = 0
  const apply = (): void => {
    raf = 0
    if (!active) return
    const span = window.innerHeight * 0.8
    const p = clamp(window.scrollY / Math.max(1, span), 0, 1)
    field.setOpacity(lerp(MOBILE_HERO_OPACITY, MOBILE_FAINT_OPACITY, p))
  }
  const onScroll = (): void => { if (!raf) raf = requestAnimationFrame(apply) }
  window.addEventListener('scroll', onScroll, { passive: true })
  // Smooth one-time reveal, then hand opacity control over to scroll.
  const tween = { o: 0 }
  gsap.to(tween, {
    o: MOBILE_HERO_OPACITY,
    duration: 0.45,
    ease: 'power2.out',
    onUpdate: () => field.setOpacity(tween.o),
    onComplete: () => { active = true; apply() },
  })
  return () => window.removeEventListener('scroll', onScroll)
}

// Reset scroll to top so the intro always exits to chapter 0. Browsers
// otherwise restore the previous scroll position on reload, which would
// reveal whatever chapter the user was on before refreshing.
window.scrollTo(0, 0)

// `body.intro-active` is set on the <body> in index.html so the browser's
// first paint already has the stage/chrome hidden — no FOUC where chapter 0
// flashes visible before JS runs. Re-add here as a safety net for HMR
// reloads, where a prior session may have removed the class.
document.body.classList.add('intro-active')

// ----- DOM scaffold (always present) -----

mountLogoSymbol()
mountCinematicOverlay()

const stage = document.getElementById('app')
if (!stage) throw new Error('main: missing #app stage')

// ----- Particle field — created up front so the intro's V exit can hand
//        off to particles already at logo state with the right scale + size. -----

// `import.meta.env.BASE_URL` resolves to the Vite `base` config — `/` in
// dev, `/Nevula/` on GitHub Pages — so the fetch path stays correct in
// both environments. A hardcoded `/assets/...` would 404 under the
// subpath deploy.
//
// Preloads run in parallel — the logo is critical-path (intro hands off to
// it), but Public_Safety can fail without blocking boot (the state file emits
// fallback positions if its preload didn't complete by the time it's needed).
await Promise.all([
  preloadLogoGlb(`${import.meta.env.BASE_URL}assets/NevulaLogo3D.glb`).catch(err => {
    console.warn('[nevula] logo GLB preload failed, falling back to SVG sampler', err)
  }),
  preloadPublicSafetyGlb(`${import.meta.env.BASE_URL}assets/Public_Safety.glb`).catch(err => {
    console.warn('[nevula] public-safety GLB preload failed', err)
  }),
  preloadMicroprocessorGlb(`${import.meta.env.BASE_URL}assets/Microprocessor.glb`).catch(err => {
    console.warn('[nevula] microprocessor GLB preload failed', err)
  }),
])

// Mobile runs a deliberately lightweight field: fewer particles, no cursor
// interactivity, no orchestration edges, and no post-FX (the bloom pass is the
// priciest part of the pipeline). Desktop keeps the full cinematic field.
const mobile = isMobile()
// On mobile the field V is the hand-off target for the intro's V. The intro is
// pulled back to fit portrait (see lib/cinematic-fit), so shrink the field V by
// the matching factor — otherwise the two Vs are different sizes and the
// crossfade pops. On desktop this factor is 1 (no change).
const heroFieldScale = mobile ? 1.15 * cinematicFitScale() : 1.15
const field = NevulaBackground(
  mobile
    ? {
        count: 1500,
        size: 0.030,
        state: 'logo',
        scale: heroFieldScale,
        interactive: false,
        lines: false,
        backgroundFx: false,
        postFx: false,
      }
    : {
        // 4500 (up from 3400) — Public Safety's GLB is geometrically denser than
        // the logo (10 plates + 10 buildings + metacube wireframe + arcs + trails
        // need to all read distinctly). Logo + other states still look right at
        // this count (more density on existing shapes, no recognition loss).
        count: 4500,
        size: 0.030,        // matches chapter 0/9 logo size
        state: 'logo',      // pre-set so the first chapter-change is a no-op
        scale: 1.15,        // matches chapter 0 scale
        interactive: true,
        lines: true,
      },
)
field.setOpacity(0)                       // hidden during intro
field.setScaleImmediate(heroFieldScale)   // engine V sits at the hero scale,
                                          // ready to crossfade in as the V forms

// ----- Chapters + chrome — all mounted up front, hidden via body.intro-active.
//        Scroll engine starts at boot too; it will tick on scrollY=0 (chapter 0)
//        but the stage is invisible while the intro plays. -----

for (const render of chapterRenderers) {
  stage.appendChild(render())
}

const ppConsole: PpConsoleHandle | null = initPpConsole()
const modularStage: ModularStageHandle | null = initModularStage()
const founderDossier: FounderDossierHandle = initFounderChapter()
const chapter1Cards: Chapter1CardsHandle = initChapter1Cards(field)
const demoDisclaimer: DemoDisclaimerHandle = initDemoDisclaimer()

document.body.appendChild(renderNav(CHAPTERS))
document.body.appendChild(renderChapterRail(CHAPTERS))
document.body.appendChild(renderScrollHint())
document.body.appendChild(renderAudioButton())

// Desktop drives the field per-chapter through the scroll engine. Mobile skips
// the engine entirely: its spacer-based snap math breaks when the spacer is
// display:none (≤820px), and a per-frame RAF is wasted on a statically-stacked
// page. Instead the field is a fixed backdrop whose opacity fades after the hero
// (enabled at intro hand-off below).
let scroll: NevulaScroll | null = null
let mobileFadeDispose: (() => void) | null = null

if (!mobile) {
  // The Modular chapter renders its own 3D stage; fade the shared particle field
  // far back while it's on screen so the stage reads against a clean studio
  // backdrop instead of competing with a dense field.
  const fieldDim = { v: 1 }

  scroll = new NevulaScroll({
    chapters: CHAPTERS,
    perChapterVh: 180,
    lerpSpeed: 1.0,
    snap: true,
    onChapterChange: (_idx, c, prev) => {
      field.setState(c.state)
      if (c.scale != null) field.setScale(c.scale)
      if (c.offset) field.setOffset(c.offset[0] ?? 0, c.offset[1] ?? 0)
      field.setSize(c.size ?? 0.022)
      // Dim the shared field ONLY while the Modular chapter (its own 3D stage) is
      // on screen. Gate strictly on enter/leave of `modular` so the intro's own
      // opacity ramp (field hidden until the cinematic hands off its V) is never
      // overridden — touching opacity on the boot/chapter-0 change revealed the
      // logo behind the intro.
      const enteringModular = c.key === 'modular'
      const leavingModular = CHAPTERS[prev]?.key === 'modular'
      if (enteringModular || leavingModular) {
        gsap.to(fieldDim, {
          v: enteringModular ? 0.08 : 1,
          duration: 0.7, ease: 'power2.out', overwrite: true,
          onUpdate: () => field.setOpacity(fieldDim.v),
        })
      }
    },
  })
}

// data-jump bindings (nav links, rail dots, brand)
document.querySelectorAll<HTMLElement>('[data-jump]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault()
    const i = parseInt(el.dataset.jump!, 10)
    if (!Number.isFinite(i)) return
    if (scroll) {
      scroll.jumpTo(i)
    } else {
      // Mobile: no scroll engine — scroll the stacked section into view natively.
      document
        .querySelector(`[data-chapter="${i}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

window.addEventListener('keydown', e => {
  // Suppress chapter-jump keys while the intro is active — the intro itself
  // listens for advancement keys to trigger its exit, and we don't want to
  // also jump-scroll the engine in the background.
  if (document.body.classList.contains('intro-active')) return
  if (!scroll) return // mobile: native scrolling, no engine jumps
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault()
    scroll.jumpTo(Math.min(CHAPTERS.length - 1, scroll.currentIndex + 1))
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault()
    scroll.jumpTo(Math.max(0, scroll.currentIndex - 1))
  } else if (e.key === 'Home') {
    scroll.jumpTo(0)
  } else if (e.key === 'End') {
    scroll.jumpTo(CHAPTERS.length - 1)
  }
})

// ----- Intro overlay -----

const refs: { intro: IntroCinematic | null } = { intro: null }

refs.intro = mountIntroCinematic({
  onExitBegin: () => {
    // The cinematic has just formed the V. Bring the engine's own particle
    // field (already at logo state, opacity 0) up to full while the cinematic
    // canvas crossfades out — both are the same V at matching scale/size, so
    // the mark stays continuous. Chapter 0 + chrome surface at the same time
    // (the .nv-stage CSS opacity transition handles the 0.9s ramp).
    // Ramp the engine V up to FULL fast (under the still-full cinematic), so the
    // cinematic can begin dissolving immediately over a complete, aligned V: the
    // engine reaches full (~0.2s) before the cinematic fade has dropped much, so
    // the mark hands off the instant it forms with no density dip.
    field.setScaleImmediate(heroFieldScale)
    if (mobile) {
      // Mobile: reveal the field to a reduced hero opacity, then let scroll fade
      // it back to a faint ambient backdrop (see enableMobileFieldFade).
      mobileFadeDispose = enableMobileFieldFade(field)
    } else {
      const tween = { opacity: 0 }
      gsap.to(tween, {
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out',
        onUpdate: () => field.setOpacity(tween.opacity),
      })
    }
    document.body.classList.remove('intro-active')
  },
  onExitComplete: () => {
    refs.intro?.dispose()
    refs.intro = null
  },
})

// HMR — dispose intro + scroll + ppConsole + shared particle context, plus
// remove every piece of DOM scaffold so the next hot run rebuilds clean.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    refs.intro?.dispose()
    scroll?.dispose()
    mobileFadeDispose?.()
    ppConsole?.dispose()
    modularStage?.dispose()
    founderDossier.dispose()
    chapter1Cards.dispose()
    demoDisclaimer.dispose()
    disposeShared()
    document.querySelectorAll(
      '.nv-nav, .nv-rail, .nv-scroll-hint, .nv-audio, .nv-cinematic-overlay, .nv-chapter, .nv-scroll-spacer, .intro-overlay, .intro-cinematic, .fd-backdrop, .dd-backdrop',
    ).forEach(el => el.remove())
    document.querySelector('#nv-iso')?.closest('svg')?.remove()
    document.body.classList.remove('intro-active', 'fd-open', 'dd-open')
  })
}

console.info('[nevula] boot ok — intro mounted, awaiting first input')
