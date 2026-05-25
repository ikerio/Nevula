import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-traction.css'

/**
 * Chapter — Traction (rail label "Traction", screen label "07 Traction").
 *
 * Renders four partner cards (3 signed LOIs + 1 live ADT pilot) followed by
 * a three-segment horizontal trajectory bar (1995–2024 XPECTRA → 2025
 * netMATRIX → Nevula 1.0 ADT pilot → 2026 Nevula independent IP).
 *
 * Source: investor PDF p.12 (GTM / LOIs) + p.18 (trajectory).
 *
 * The ADT card is visually elevated:
 *   - orange glow ring (box-shadow)
 *   - "Pilot live" pulsing badge instead of "Signed LOI"
 *   - "3,000 clients" stat replaces the "Signed" copy.
 *
 * No JS lifecycle yet — the chapter is purely declarative. If we later want
 * the trajectory segments to highlight as the chapter scrolls into view,
 * that's a follow-up using the same scroll-progress IntersectionObserver
 * the other chapters use via `--i`.
 */
export function renderChapterTraction(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-traction" data-chapter="7" data-screen-label="07 Traction">
      <div class="layout">
        <div class="trc-head">
          <div class="nv-eyebrow">
            <span class="num">07</span>
            <span class="bar"></span>
            <span>Real-world momentum</span>
          </div>
          <h2 class="nv-title size-l">
            The integrators<br/><em>we're building with.</em>
          </h2>
          <p class="nv-lede">
            Signed pilot LOIs with the largest names in security &mdash; and a live
            pilot with ADT installing 3,000 clients. Every deployment compounds
            into recurring revenue and certified integrations on the platform.
          </p>
        </div>

        <div class="trc-cards">
          <article class="trc-card" style="--n: 0">
            <div class="trc-card-top">
              <span class="trc-badge"><span class="dot"></span>Signed LOI</span>
              <span class="trc-ix">01</span>
            </div>
            <h5 class="trc-name">Johnson Controls</h5>
            <p class="trc-meta">Building-systems &amp; security integrator</p>
            <div class="trc-stat">
              <span class="lbl">scope</span>
              <span class="v">Multi-vertical pilot</span>
            </div>
          </article>

          <article class="trc-card" style="--n: 1">
            <div class="trc-card-top">
              <span class="trc-badge"><span class="dot"></span>Signed LOI</span>
              <span class="trc-ix">02</span>
            </div>
            <h5 class="trc-name">Honeywell</h5>
            <p class="trc-meta">Industrial &amp; commercial security</p>
            <div class="trc-stat">
              <span class="lbl">scope</span>
              <span class="v">Joint integration pilot</span>
            </div>
          </article>

          <article class="trc-card" style="--n: 2">
            <div class="trc-card-top">
              <span class="trc-badge"><span class="dot"></span>Signed LOI</span>
              <span class="trc-ix">03</span>
            </div>
            <h5 class="trc-name">Inter-Con Security</h5>
            <p class="trc-meta">Global security services</p>
            <div class="trc-stat">
              <span class="lbl">scope</span>
              <span class="v">Manned-services workflows</span>
            </div>
          </article>

          <article class="trc-card is-live" style="--n: 3">
            <div class="trc-card-top">
              <span class="trc-badge is-live"><span class="dot"></span>Pilot live</span>
              <span class="trc-ix">04</span>
            </div>
            <h5 class="trc-name">ADT</h5>
            <p class="trc-meta">Nevula 1.0 pilot &middot; installing now</p>
            <div class="trc-stat">
              <span class="lbl">deployment</span>
              <span class="v"><strong>3,000</strong> clients</span>
            </div>
          </article>
        </div>

        <div class="trc-trajectory">
          <div class="trc-traj-rail" aria-hidden="true">
            <span class="trc-traj-line"></span>
            <span class="trc-traj-node" style="left: 0%"></span>
            <span class="trc-traj-node" style="left: 50%"></span>
            <span class="trc-traj-node now" style="left: 100%"></span>
          </div>

          <div class="trc-traj-segments">
            <div class="trc-seg" style="--n: 0">
              <span class="trc-seg-range">1995 &mdash; 2024</span>
              <h6>XPECTRA</h6>
              <p>5M+ sensors deployed across LatAm. $35M+ in contracts. 100+ enterprise deployments with banks, retail, and industrial clients.</p>
            </div>
            <div class="trc-seg" style="--n: 1">
              <span class="trc-seg-range">2025</span>
              <h6>netMATRIX &rarr; Nevula 1.0</h6>
              <p>XPECTRA ideates Nevula. Spun off as Nevula Tech Inc. and launches the ADT pilot &mdash; 3,000 clients installing.</p>
            </div>
            <div class="trc-seg" style="--n: 2">
              <span class="trc-seg-range">2026 &middot; now</span>
              <h6>Nevula independent</h6>
              <p>Independent company, owner of IP. Signed LOIs with Johnson Controls, Honeywell, and Inter-Con Security. Seeking seed capital.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `)
}
