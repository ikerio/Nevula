import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-0.css'

export function renderChapter0(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-0" data-chapter="0" data-screen-label="00 Opening">
      <div class="layout">
        <div class="opening-text">
          <div class="nv-eyebrow">
            <span class="pip"></span>
            <span class="num">00</span>
            <span class="bar"></span>
            <span>Nevula &middot; Orchestration platform</span>
          </div>
          <h1 class="nv-title size-xl">
            Security<br/><em>simplified.</em>
          </h1>
          <p class="nv-lede">
            The orchestration platform for launching modern security solutions
            &mdash; empowering integrators, security firms, and solution developers
            to ship SaaS-grade services in weeks, not months.
          </p>
        </div>
      </div>
    </section>
  `)
}
