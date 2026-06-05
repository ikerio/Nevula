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
import { chapterRenderers } from './chapters'
import { initChapter1Cards, type Chapter1CardsHandle } from './chapters/ch-1'
import { initPpConsole, type PpConsoleHandle } from './chapters/ch-3-console'
import { initFounderChapter } from './chapters/ch-5'
import type { FounderDossierHandle } from './chapters/ch-5-dossier'
import { NevulaScroll } from './scroll/scroll-engine'
import { CHAPTERS } from './scroll/chapter-config'
import { NevulaBackground, disposeShared } from './engine'
import { preloadLogoGlb } from './engine/states/logo'
import { preloadPublicSafetyGlb } from './engine/states/public-safety'
import { preloadMicroprocessorGlb } from './engine/states/microprocessor'

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

const field = NevulaBackground({
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
})
field.setOpacity(0)             // hidden during intro
field.setScaleImmediate(1.15)   // engine V sits at chapter-0 scale, ready to
                                // crossfade in when the cinematic forms its V

// ----- Chapters + chrome — all mounted up front, hidden via body.intro-active.
//        Scroll engine starts at boot too; it will tick on scrollY=0 (chapter 0)
//        but the stage is invisible while the intro plays. -----

for (const render of chapterRenderers) {
  stage.appendChild(render())
}

const ppConsole: PpConsoleHandle | null = initPpConsole()
const founderDossier: FounderDossierHandle = initFounderChapter()
const chapter1Cards: Chapter1CardsHandle = initChapter1Cards(field)

document.body.appendChild(renderNav())
document.body.appendChild(renderChapterRail(CHAPTERS))
document.body.appendChild(renderScrollHint())
document.body.appendChild(renderAudioButton())

const scroll = new NevulaScroll({
  chapters: CHAPTERS,
  perChapterVh: 180,
  lerpSpeed: 1.0,
  snap: true,
  onChapterChange: (_idx, c, _prev) => {
    field.setState(c.state)
    if (c.scale != null) field.setScale(c.scale)
    if (c.offset) field.setOffset(c.offset[0] ?? 0, c.offset[1] ?? 0)
    field.setSize(c.size ?? 0.022)
  },
})

// data-jump bindings (nav links, rail dots, brand)
document.querySelectorAll<HTMLElement>('[data-jump]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault()
    const i = parseInt(el.dataset.jump!, 10)
    if (Number.isFinite(i)) scroll.jumpTo(i)
  })
})

window.addEventListener('keydown', e => {
  // Suppress chapter-jump keys while the intro is active — the intro itself
  // listens for advancement keys to trigger its exit, and we don't want to
  // also jump-scroll the engine in the background.
  if (document.body.classList.contains('intro-active')) return
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
    field.setScaleImmediate(1.15)
    const tween = { opacity: 0 }
    gsap.to(tween, {
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out',
      onUpdate: () => field.setOpacity(tween.opacity),
    })
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
    scroll.dispose()
    ppConsole?.dispose()
    founderDossier.dispose()
    chapter1Cards.dispose()
    disposeShared()
    document.querySelectorAll(
      '.nv-nav, .nv-rail, .nv-scroll-hint, .nv-audio, .nv-cinematic-overlay, .nv-chapter, .nv-scroll-spacer, .intro-overlay, .intro-cinematic, .fd-backdrop',
    ).forEach(el => el.remove())
    document.querySelector('#nv-iso')?.closest('svg')?.remove()
    document.body.classList.remove('intro-active', 'fd-open')
  })
}

console.info('[nevula] boot ok — intro mounted, awaiting first input')
