import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-mfst.css'

/**
 * Chapter 7 — Manifesto / Ecosystem.
 * Editorial centered body + three pillars (monitoring companies, integrators,
 * manufacturers). Particle state is `nebula` with scale 1.10.
 */
export function renderChapterMfst(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-mfst" data-chapter="7" data-screen-label="07 Manifesto">
      <div class="layout">
        <div class="mfst">
          <div class="nv-eyebrow">
            <span class="num">07</span>
            <span class="bar"></span>
            <span>The Bigger Picture</span>
          </div>
          <p class="mfst-body">
            Nevula isn't just a platform.<br/>
            It's <em>infrastructure</em>. An <em>ecosystem</em>.<br/>
            Built to grow, scale, and transform<br/>
            the way we live <em>securely</em>.
          </p>
          <p class="mfst-sub">
            Whether you're a monitoring company, an integrator, or a sensor
            manufacturer &mdash; Nevula gives you the tools to build the future
            of protection today.
          </p>

          <div class="mfst-pillars">
            <div class="pillar">
              <span class="num">01 &middot; For Monitoring Companies</span>
              <h6>Modernize your central station</h6>
              <p>Replace fragmented legacy stacks with a single AI-powered console &mdash; multi-tenant, multi-protocol, cloud-native.</p>
            </div>
            <div class="pillar">
              <span class="num">02 &middot; For Integrators</span>
              <h6>Deliver in weeks, not years</h6>
              <p>Spin up branded monitoring centers for governments, banks, and cities &mdash; straight from a browser. No servers required.</p>
            </div>
            <div class="pillar">
              <span class="num">03 &middot; For Manufacturers</span>
              <h6>One ecosystem, every market</h6>
              <p>List certified sensors in Nevula's registry and reach every integrator on the network with zero custom work.</p>
            </div>
          </div>

          <p class="mfst-tag">Build the future of protection <em>&middot; today.</em></p>
        </div>
      </div>
    </section>
  `)
}
