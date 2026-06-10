/**
 * Dev-only isolated harness for chapter 4 (Modular by design).
 *
 * Mounts just the chapter into a fixed full-viewport root, forces it visible
 * (--i:1), inits the 3D stage controller, and fires a synthetic `nv:chapter`
 * index-4 event so the auto-loop runs — all without the intro cinematic or the
 * scroll engine. Open at /chmodular-preview.html. Not referenced by the
 * production build (main.ts / index.html).
 */
import './styles/reset.css'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/layout.css'

import { mountLogoSymbol } from './components/logo-mark'
import { renderChapterModular } from './chapters/ch-modular'
import { initModularStage } from './chapters/ch-modular-stage'
import { dispatchChapterChange } from './lib/events'

mountLogoSymbol() // provides #nv-iso used by the console brand mark

const root = document.getElementById('chmodular-root')!
const section = renderChapterModular()
section.style.setProperty('--i', '1') // engine normally drives this on scroll
root.appendChild(section)

const handle = initModularStage()
;(window as unknown as { __mc: typeof handle }).__mc = handle // dev hook

// Pretend the scroll engine just brought chapter 4 into view → starts the loop.
dispatchChapterChange({ index: 4, key: 'modular', prev: 3 })
