/**
 * Dev-only isolated harness for chapter 5 (Founders). Mounts just the chapter
 * into a fixed full-viewport root, forces it visible (--i:1), and wires the
 * dossier handlers — without the intro/scroll engine. Open at /ch5-preview.html.
 * Not referenced by the production build.
 */
import './styles/reset.css'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/layout.css'

import { mountLogoSymbol } from './components/logo-mark'
import { renderChapter5, initFounderChapter } from './chapters/ch-5'

mountLogoSymbol()

const root = document.getElementById('ch5-root')!
const section = renderChapter5()
section.style.setProperty('--i', '1')
root.appendChild(section)

initFounderChapter()
