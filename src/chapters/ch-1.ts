import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-1.css'

export function renderChapter1(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-1" data-chapter="1" data-screen-label="01 What Is Nevula">
      <div class="layout">
        <div class="ch1-head">
          <div class="nv-eyebrow">
            <span class="num">01</span>
            <span class="bar"></span>
            <span>What Is Nevula?</span>
          </div>
          <h2 class="nv-title size-l">
            Digital infrastructure<br/><em>for SafeTech.</em>
          </h2>
          <p class="nv-lede">
            A SaaS / IoTaaS platform powering solutions across smart cities,
            public safety, logistics, home security, healthcare, and pet care &mdash;
            through AI, LPWAN connectivity, and an open API ecosystem.
            Scalable, interoperable, cost-effective.
          </p>
        </div>
      </div>

      <div class="use-strip">
        <div class="use-card">
          <span class="ix">01 &middot; Smart cities</span>
          <h5>Utilities &middot; mobility</h5>
          <p>Environmental telemetry, municipal coordination, public infra.</p>
        </div>
        <div class="use-card">
          <span class="ix">02 &middot; Public safety</span>
          <h5>Response &amp; intelligence</h5>
          <p>911 modernization, crime intelligence, dispatch coordination.</p>
        </div>
        <div class="use-card">
          <span class="ix">03 &middot; Logistics</span>
          <h5>Fleet &amp; cold chain</h5>
          <p>Trucks, cargo seals, asset tags on a single LPWAN backbone.</p>
        </div>
        <div class="use-card">
          <span class="ix">04 &middot; Connected life</span>
          <h5>Home &middot; health &middot; pet</h5>
          <p>Residential, healthcare, and pet-care sensors at SMS-level cost.</p>
        </div>
      </div>
    </section>
  `)
}
