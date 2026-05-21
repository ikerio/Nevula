import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-4.css'

export function renderChapter4(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-4" data-chapter="6" data-screen-label="06 Built For">
      <div class="layout">
        <div class="ch4-side">
          <div class="nv-eyebrow">
            <span class="num">06</span>
            <span class="bar"></span>
            <span>Built For</span>
          </div>
          <h2 class="nv-title size-l">
            Same platform,<br/><em>three growth engines.</em>
          </h2>
          <p class="nv-lede">
            Integrators, service providers, and security firms &mdash; all launch
            modern SaaS-grade services on one open API stack. Equipment,
            monitoring, AI, billing &mdash; bundled and ready to white-label.
          </p>

          <div class="vert-list">
            <div class="vert-row">
              <span class="ix">01</span>
              <span class="vname">Integrators
                <span class="desc">Turn one-time installs into recurring revenue</span>
              </span>
              <span class="vstat"><strong>$4</strong>per endpoint &middot; mo</span>
            </div>
            <div class="vert-row">
              <span class="ix">02</span>
              <span class="vname">Service Providers
                <span class="desc">White-labeled monitoring &amp; response</span>
              </span>
              <span class="vstat"><strong>$180</strong>per site &middot; mo</span>
            </div>
            <div class="vert-row">
              <span class="ix">03</span>
              <span class="vname">Security Firms
                <span class="desc">Extend physical security with predictive AI</span>
              </span>
              <span class="vstat"><strong>$620</strong>per location &middot; mo</span>
            </div>
          </div>
        </div>
      </div>

      <div class="recur-badge">
        <span class="lbl">recurring revenue</span>
        <span class="stat">$240M<span class="u">/ yr &middot; y5 target</span></span>
        <p>Multi-tenant by default. Predictable subscription revenue, layered on top of one shared SafeTech platform.</p>
      </div>
    </section>
  `)
}
