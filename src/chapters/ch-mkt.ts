import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-mkt.css'

/**
 * Chapter 5 — Sensor Marketplace.
 * Centered headline on top, bento mosaic of certified sensor tiles below.
 * Tile span variants: t-2x2, t-2x1, t-1x2, default 1x1.
 */
export function renderChapterMkt(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-mkt" data-chapter="5" data-screen-label="05 Marketplace">
      <div class="layout">
        <div class="mkt-head">
          <div class="nv-eyebrow">
            <span class="num">05</span>
            <span class="bar"></span>
            <span>Sensor Marketplace</span>
          </div>
          <h2 class="nv-title size-l">
            Certified sensors,<br/><em>integrated in minutes.</em>
          </h2>
          <p class="nv-lede">
            Manufacturers list their devices in Nevula's certified registry.
            Integrators link them with one click &mdash; every protocol, every vendor,
            one open ecosystem.
          </p>
        </div>

        <div class="mosaic">
          <div class="tile feature t-2x2">
            <div class="top-row">
              <span class="vendor">ARCFIRE &middot; Pro</span>
              <span class="cert">Certified</span>
            </div>
            <div class="thumb">
              <svg viewBox="0 0 24 24"><path d="M12 3c1.5 4 5 5 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-8z"/></svg>
            </div>
            <h5>Heat &amp; smoke node</h5>
            <div class="bot-row">
              <span class="price">$84<span class="u">/ unit</span></span>
              <span class="integ">Ready &middot; 2 min</span>
            </div>
          </div>

          <div class="tile t-2x1">
            <div class="top-row">
              <span class="vendor">SENTRY &middot; v3</span>
              <span class="cert">Certified</span>
            </div>
            <div class="thumb">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div class="bot-row">
              <span class="price">$36<span class="u">/ unit</span></span>
              <span class="integ">Ready &middot; 1 min</span>
            </div>
          </div>

          <div class="tile">
            <div class="top-row">
              <span class="vendor">LYNX</span>
              <span class="cert">Cert</span>
            </div>
            <h5>Door contact</h5>
            <div class="bot-row">
              <span class="price">$12</span>
              <span class="integ">3 min</span>
            </div>
          </div>

          <div class="tile">
            <div class="top-row">
              <span class="vendor">AURA</span>
              <span class="cert">Cert</span>
            </div>
            <h5>Glass break</h5>
            <div class="bot-row">
              <span class="price">$28</span>
              <span class="integ">4 min</span>
            </div>
          </div>

          <div class="tile t-2x1">
            <div class="top-row">
              <span class="vendor">VECTOR &middot; LTE-M</span>
              <span class="cert">Certified</span>
            </div>
            <div class="thumb">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="3"/><path d="M12 22s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z"/></svg>
            </div>
            <div class="bot-row">
              <span class="price">$148<span class="u">/ unit</span></span>
              <span class="integ">Ready &middot; 5 min</span>
            </div>
          </div>

          <div class="tile t-1x2">
            <div class="top-row">
              <span class="vendor">ZENITH &middot; Bio</span>
              <span class="cert">Cert</span>
            </div>
            <div class="thumb">
              <svg viewBox="0 0 24 24"><path d="M3 13h4l2-5 4 10 2-5h6"/></svg>
            </div>
            <h5>Health wearable</h5>
            <div class="bot-row">
              <span class="price">$92<span class="u">/ unit</span></span>
              <span class="integ">8 min</span>
            </div>
          </div>

          <div class="tile t-2x1">
            <div class="top-row">
              <span class="vendor">PULSE</span>
              <span class="cert">Cert</span>
            </div>
            <h5>PIR motion sensor</h5>
            <div class="bot-row">
              <span class="price">$22<span class="u">/ unit</span></span>
              <span class="integ">Ready &middot; 3 min</span>
            </div>
          </div>

          <div class="tile">
            <div class="top-row">
              <span class="vendor">VERA</span>
              <span class="cert">Cert</span>
            </div>
            <h5>Air quality</h5>
            <div class="bot-row">
              <span class="price">$54</span>
              <span class="integ">6 min</span>
            </div>
          </div>

          <div class="tile">
            <div class="top-row">
              <span class="vendor">NIMBUS</span>
              <span class="cert">Cert</span>
            </div>
            <h5>Water leak</h5>
            <div class="bot-row">
              <span class="price">$18</span>
              <span class="integ">2 min</span>
            </div>
          </div>

          <div class="tile t-2x1">
            <div class="top-row">
              <span class="vendor">HALO &middot; pet</span>
              <span class="cert">Certified</span>
            </div>
            <div class="thumb">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M9 21l1-7-3-2 2-5 4 2 3 2 3 4"/></svg>
            </div>
            <div class="bot-row">
              <span class="price">$64<span class="u">/ unit</span></span>
              <span class="integ">Ready &middot; 4 min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `)
}
