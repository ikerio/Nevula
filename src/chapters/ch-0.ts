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
            <span>Nevula &middot; SafeTech orchestration</span>
          </div>
          <h1 class="nv-title size-l">
            The <em>orchestration layer</em><br/>
            for modern security &amp;<br/>
            monitoring services.
          </h1>
          <p class="nv-lede-lead">
            Nevula redefines how security and monitoring solutions are
            built, delivered, and scaled.
          </p>
          <p class="nv-lede">
            Empowering integrators, service providers, and security firms to
            launch modern security services in weeks, not months.
          </p>
          <ul class="hero-chips" aria-label="Platform highlights">
            <li class="hero-chip"><span class="dot"></span>Cloud-native</li>
            <li class="hero-chip"><span class="dot"></span>AI-powered</li>
            <li class="hero-chip"><span class="dot"></span>Zero IT CapEx</li>
          </ul>
        </div>
      </div>
    </section>
  `)
}
