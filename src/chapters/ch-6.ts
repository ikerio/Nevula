import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-6.css'

export function renderChapter6(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-6" data-chapter="9" data-screen-label="09 Closing">
      <div class="layout">
        <div class="closing-text">
          <div class="nv-eyebrow">
            <span class="num">09</span>
            <span class="bar"></span>
            <span>One platform &middot; Every industry</span>
          </div>
          <h2 class="nv-title size-xl">
            Six industries.<br/><em>One Nevula.</em>
          </h2>

          <div class="closing-tags">
            <span>AI</span>
            <span>LPWAN</span>
            <span>Open API</span>
            <span>Multi-tenant</span>
          </div>

          <div class="nv-stat-strip">
            <div class="cell">
              <span class="nm">deployment</span>
              <span class="v">7<span class="u">days</span></span>
            </div>
            <div class="cell">
              <span class="nm">platform uptime</span>
              <span class="v">99.98<span class="u">%</span></span>
            </div>
            <div class="cell">
              <span class="nm">protocols</span>
              <span class="v">14<span class="u">supported</span></span>
            </div>
          </div>

          <div class="nv-ctas">
            <a href="#" class="nv-btn nv-btn-primary">Request investor brief
              <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a href="#" class="nv-btn nv-btn-ghost">View the platform</a>
          </div>
        </div>
      </div>
    </section>
  `)
}
