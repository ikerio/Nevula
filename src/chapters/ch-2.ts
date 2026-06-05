import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-2.css'

export function renderChapter2(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-2" data-chapter="2" data-screen-label="02 How Nevula Works">
      <div class="layout">
        <div class="ch2-head">
          <div class="nv-eyebrow">
            <span class="num">02</span>
            <span class="bar"></span>
            <span>How Nevula Works</span>
          </div>
          <h2 class="nv-title size-l">
            One platform,<br/><em>every brand on top.</em>
          </h2>
          <p class="nv-lede-lead">
            Nevula is a single multi-tenant SaaS / IoTaaS platform &mdash; one
            backbone powering every integrator, developer, and service provider.
          </p>
          <p class="nv-lede">
            The same platform supports every channel and vertical, and partners
            white-label it to launch their own branded solutions.
          </p>
        </div>
      </div>

      <div class="ch2-strip">
        <div class="stat-card">
          <span class="lbl">01 &middot; Cloud</span>
          <h5>Nevula Cloud</h5>
          <p>The intelligent heart of the system.</p>
        </div>
        <div class="stat-card">
          <span class="lbl">02 &middot; Monitoring</span>
          <h5>Central Monitoring</h5>
          <p>Connected applications, one console.</p>
        </div>
        <div class="stat-card">
          <span class="lbl">03 &middot; AI</span>
          <h5>Predictive AI</h5>
          <p>From data to actionable decisions.</p>
        </div>
        <div class="stat-card">
          <span class="lbl">04 &middot; Automation</span>
          <h5>Smart Automation</h5>
          <p>Dynamic rules and orchestration.</p>
        </div>
        <div class="stat-card">
          <span class="lbl">05 &middot; Sensors</span>
          <h5>Sensor Ecosystem</h5>
          <p>Communities of devices, multi-vendor.</p>
        </div>
        <div class="stat-card">
          <span class="lbl">06 &middot; IoT</span>
          <h5>IoT Connectivity</h5>
          <p>LPWAN backbone &amp; open APIs.</p>
        </div>
      </div>
    </section>
  `)
}
