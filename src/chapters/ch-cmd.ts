import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-cmd.css'

/**
 * Chapter 4 — Command Centers.
 * Browser-spawned monitoring centers, assigned operators, response units
 * (ambulance / tow / patrol). Board sits LEFT, headline + bullets RIGHT.
 */
export function renderChapterCmd(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-cmd" data-chapter="4" data-screen-label="04 Command Centers">
      <div class="layout">
        <div class="cmd-stage">
          <div class="cmd-board">
            <div class="cmd-top">
              <div class="lhs">
                <span class="tt">Operations &middot; Network</span>
              </div>
              <div class="rhs">
                <span><em>6</em>centers live</span>
                <span><em>47</em>operators</span>
                <span><em>189</em>units deployed</span>
              </div>
            </div>

            <div class="cmd-grid">
              <div class="cmd-center">
                <span class="cmd-name">CDMX &middot; Polanco</span>
                <div class="cmd-meta">
                  <span>Municipal</span>
                  <span class="pill alerts"><span class="dot"></span>3 alerts</span>
                </div>
                <div class="map">
                  <span class="pin" style="top:24%;left:18%"></span>
                  <span class="pin" style="top:46%;left:38%"></span>
                  <span class="pin alert" style="top:64%;left:58%"></span>
                  <span class="pin" style="top:30%;left:72%"></span>
                  <span class="pin alert" style="top:78%;left:82%"></span>
                  <span class="pin" style="top:54%;left:88%"></span>
                </div>
                <div class="cmd-foot">
                  <div class="cmd-ops">
                    <span class="op">AM</span>
                    <span class="op">JL</span>
                    <span class="op">RC</span>
                    <span class="op more">+4</span>
                  </div>
                  <span class="cmd-stat">312<span class="u">nodes</span></span>
                </div>
              </div>

              <div class="cmd-center">
                <span class="cmd-name">Bogot&aacute; &middot; Chapinero</span>
                <div class="cmd-meta">
                  <span>Private</span>
                  <span class="pill ok"><span class="dot"></span>nominal</span>
                </div>
                <div class="map">
                  <span class="pin" style="top:32%;left:22%"></span>
                  <span class="pin" style="top:48%;left:46%"></span>
                  <span class="pin" style="top:22%;left:64%"></span>
                  <span class="pin" style="top:68%;left:38%"></span>
                  <span class="pin" style="top:58%;left:78%"></span>
                </div>
                <div class="cmd-foot">
                  <div class="cmd-ops">
                    <span class="op">CM</span>
                    <span class="op">SV</span>
                    <span class="op more">+3</span>
                  </div>
                  <span class="cmd-stat">204<span class="u">nodes</span></span>
                </div>
              </div>

              <div class="cmd-center">
                <span class="cmd-name">S&atilde;o Paulo &middot; Pinheiros</span>
                <div class="cmd-meta">
                  <span>Banking</span>
                  <span class="pill alerts"><span class="dot"></span>1 alert</span>
                </div>
                <div class="map">
                  <span class="pin" style="top:28%;left:30%"></span>
                  <span class="pin alert" style="top:54%;left:52%"></span>
                  <span class="pin" style="top:42%;left:74%"></span>
                  <span class="pin" style="top:72%;left:34%"></span>
                  <span class="pin" style="top:38%;left:18%"></span>
                </div>
                <div class="cmd-foot">
                  <div class="cmd-ops">
                    <span class="op">RA</span>
                    <span class="op">FC</span>
                    <span class="op">DM</span>
                    <span class="op more">+5</span>
                  </div>
                  <span class="cmd-stat">468<span class="u">nodes</span></span>
                </div>
              </div>

              <div class="cmd-center">
                <span class="cmd-name">Quito &middot; La Carolina</span>
                <div class="cmd-meta">
                  <span>Community</span>
                  <span class="pill ok"><span class="dot"></span>nominal</span>
                </div>
                <div class="map">
                  <span class="pin" style="top:42%;left:24%"></span>
                  <span class="pin" style="top:62%;left:48%"></span>
                  <span class="pin" style="top:30%;left:68%"></span>
                  <span class="pin" style="top:50%;left:82%"></span>
                </div>
                <div class="cmd-foot">
                  <div class="cmd-ops">
                    <span class="op">EP</span>
                    <span class="op">LN</span>
                    <span class="op more">+2</span>
                  </div>
                  <span class="cmd-stat">86<span class="u">nodes</span></span>
                </div>
              </div>

              <div class="cmd-center">
                <span class="cmd-name">Lima &middot; Miraflores</span>
                <div class="cmd-meta">
                  <span>Mixed-use</span>
                  <span class="pill alerts"><span class="dot"></span>2 alerts</span>
                </div>
                <div class="map">
                  <span class="pin" style="top:34%;left:26%"></span>
                  <span class="pin alert" style="top:48%;left:58%"></span>
                  <span class="pin" style="top:64%;left:42%"></span>
                  <span class="pin alert" style="top:72%;left:76%"></span>
                  <span class="pin" style="top:24%;left:72%"></span>
                </div>
                <div class="cmd-foot">
                  <div class="cmd-ops">
                    <span class="op">VR</span>
                    <span class="op">GA</span>
                    <span class="op more">+3</span>
                  </div>
                  <span class="cmd-stat">152<span class="u">nodes</span></span>
                </div>
              </div>

              <div class="cmd-center">
                <span class="cmd-name">B. Aires &middot; Palermo</span>
                <div class="cmd-meta">
                  <span>Retail</span>
                  <span class="pill ok"><span class="dot"></span>nominal</span>
                </div>
                <div class="map">
                  <span class="pin" style="top:28%;left:34%"></span>
                  <span class="pin" style="top:50%;left:54%"></span>
                  <span class="pin" style="top:66%;left:24%"></span>
                  <span class="pin" style="top:42%;left:78%"></span>
                  <span class="pin" style="top:70%;left:64%"></span>
                </div>
                <div class="cmd-foot">
                  <div class="cmd-ops">
                    <span class="op">MO</span>
                    <span class="op">PT</span>
                    <span class="op">BC</span>
                    <span class="op more">+6</span>
                  </div>
                  <span class="cmd-stat">274<span class="u">nodes</span></span>
                </div>
              </div>
            </div>

            <div class="cmd-units">
              <div class="cmd-unit">
                <span class="uico"><svg viewBox="0 0 24 24"><path d="M3 17h18M3 11h12l3-3h3v9M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM10 8v3M8.5 9.5h3"/></svg></span>
                <span class="uname">Ambulances
                  <span class="sub">EMS &middot; Tier 1</span>
                </span>
                <span class="ucount">12<span class="u">on duty</span></span>
              </div>
              <div class="cmd-unit">
                <span class="uico"><svg viewBox="0 0 24 24"><path d="M3 18h6m6 0h6M3 18v-2l3-6h6l3 4h6v4M7 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM15 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM15 12l4 2"/></svg></span>
                <span class="uname">Tow trucks
                  <span class="sub">Roadside &middot; 24/7</span>
                </span>
                <span class="ucount">8<span class="u">on duty</span></span>
              </div>
              <div class="cmd-unit">
                <span class="uico"><svg viewBox="0 0 24 24"><path d="M3 17h18M3 11l3-4h12l3 4M3 11v6h18v-6M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM14 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M11 11h2v2h-2z"/></svg></span>
                <span class="uname">Patrol cars
                  <span class="sub">Field response</span>
                </span>
                <span class="ucount">27<span class="u">on duty</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="cmd-head">
          <div class="nv-eyebrow">
            <span class="num">04</span>
            <span class="bar"></span>
            <span>Command Centers</span>
          </div>
          <h2 class="nv-title size-l">
            Stand up a monitoring center<br/><em>straight from the browser.</em>
          </h2>
          <p class="nv-lede">
            For integrators delivering for governments, banks, and cities &mdash;
            no servers to provision, no per-seat licensing, no custom
            development. Spin up tenants, assign operators, deploy units.
          </p>

          <div class="cmd-bullets">
            <div class="cmd-bullet">
              <span class="ix">01</span>
              <div>
                <h6>Multi-tenant by default</h6>
                <p>Provision a fully-branded monitoring center for every customer or jurisdiction in minutes.</p>
              </div>
            </div>
            <div class="cmd-bullet">
              <span class="ix">02</span>
              <div>
                <h6>Operator &amp; sub-tenant control</h6>
                <p>Assign operators with scoped roles and generate mini-consoles for specific communities or districts.</p>
              </div>
            </div>
            <div class="cmd-bullet">
              <span class="ix">03</span>
              <div>
                <h6>Live response orchestration</h6>
                <p>Dispatch ambulances, patrol cars, tow trucks &mdash; and track them on the same operator pane of glass.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `)
}
