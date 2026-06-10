import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-6.css'

export function renderChapter6(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-6" data-chapter="6" data-screen-label="06 Closing">
      <div class="layout">
        <div class="closing-text">
          <div class="nv-eyebrow">
            <span class="num">06</span>
            <span class="bar"></span>
            <span>One platform &middot; Every industry</span>
          </div>
          <h2 class="nv-title size-xl">
            Built for anything.<br/><em>One Nevula.</em>
          </h2>

          <div class="closing-tags">
            <span>AI</span>
            <span>LPWAN</span>
            <span>Open API</span>
            <span>Multi-tenant</span>
          </div>

          <div class="nv-ctas">
            <a href="${import.meta.env.BASE_URL}platform/onboarding/index.html" target="_blank" rel="noopener" data-demo-link class="nv-btn nv-btn-primary">View onboarding
              <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
            <a href="${import.meta.env.BASE_URL}platform/station/index.html" target="_blank" rel="noopener" data-demo-link class="nv-btn nv-btn-ghost">Explore the demo</a>
          </div>

          <div class="closing-contact">
            <div class="cc-item">
              <span class="cc-label"><span class="dot"></span>Email</span>
              <a class="cc-value" href="mailto:info@nevula.com">info@nevula.com</a>
            </div>
            <div class="cc-item">
              <span class="cc-label"><span class="dot"></span>Corporate office</span>
              <address class="cc-value">General Salvador Alvarado N&deg; 8, Corporativo Quantum, Piso 5, Interior 507 y 508<br/>Colonia Hip&oacute;dromo Condesa, Delegaci&oacute;n Cuauht&eacute;moc, M&eacute;xico D.F. CP 06100</address>
            </div>
          </div>
        </div>
      </div>
    </section>
  `)
}
