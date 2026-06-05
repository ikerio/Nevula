/**
 * Dev-only isolated harness for chapter 3 (Plug & Play console).
 *
 * Mounts just the chapter into a fixed full-viewport root, forces it visible
 * (--i:1), inits the console director, and fires a synthetic `nv:chapter`
 * index-3 event so the auto-loop runs — all without the intro cinematic or the
 * scroll engine. Open at /ch3-preview.html. Not referenced by the production
 * build (main.ts / index.html).
 */
import './styles/reset.css'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/layout.css'

import { mountLogoSymbol } from './components/logo-mark'
import { renderChapter3 } from './chapters/ch-3'
import { initPpConsole } from './chapters/ch-3-console'
import { dispatchChapterChange } from './lib/events'

mountLogoSymbol()

const root = document.getElementById('ch3-root')!
const section = renderChapter3()
section.style.setProperty('--i', '1') // engine normally drives this on scroll
root.appendChild(section)

const handle = initPpConsole()
;(window as unknown as { __pp: typeof handle }).__pp = handle // dev: __pp.goto(0|1|2)

// Pretend the scroll engine just brought chapter 3 into view → starts the loop.
dispatchChapterChange({ index: 3, key: 'plugplay', prev: 2 })

// ?surf=N holds a single surface (paused) for screenshots/inspection.
const only = new URLSearchParams(location.search).get('surf')
if (only !== null && handle) handle.goto(Number(only))
