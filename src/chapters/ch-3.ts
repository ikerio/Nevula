import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-3.css'

/**
 * Chapter 3 — Plug & Play.
 *
 * The interactive console auto-loops Fire → Access → Panic → Health → Mobility
 * on 1900ms beats, holds for 4200ms, then resets. The sequencer logic lives
 * in `./ch-3-console.ts`; this module only renders the static markup.
 */
export function renderChapter3(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-3" data-chapter="3" data-screen-label="03 Plug & Play">
      <div class="layout">
        <div class="pp-head">
          <div class="nv-eyebrow">
            <span class="num">03</span>
            <span class="bar"></span>
            <span>Plug &amp; Play</span>
          </div>
          <h2 class="nv-title size-l">
            One console.<br/><em>Every device family.</em>
          </h2>
          <p class="nv-lede">
            Fire sensors, panic buttons, door contacts, health monitors, mobility
            trackers &mdash; link any device family and Nevula's console reconfigures
            itself in real time. Widgets self-configure, telemetry flows,
            alerts land on the same pane of glass. No custom integrations.
            No separate vendor consoles.
          </p>

          <div class="pp-stats">
            <div class="pp-stat">
              <span class="lbl">01 &middot; Families</span>
              <span class="v">12+<span class="u">supported</span></span>
              <span class="ds">Fire &middot; panic &middot; access &middot; health &middot; mobility &middot; more.</span>
            </div>
            <div class="pp-stat">
              <span class="lbl">02 &middot; Setup</span>
              <span class="v">0<span class="u">SDKs</span></span>
              <span class="ds">Widgets self-configure when a family is linked.</span>
            </div>
            <div class="pp-stat">
              <span class="lbl">03 &middot; Glass</span>
              <span class="v">1<span class="u">console</span></span>
              <span class="ds">Cross-vendor, cross-protocol, one operator view.</span>
            </div>
          </div>
        </div>

        <div class="pp-stage" id="ppStage">
          <button class="pp-replay" id="ppReplay" aria-label="Replay sequence">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7"/>
              <path d="M3 4v5h5"/>
            </svg>
          </button>

          <div class="pp-console">
            <div class="pp-top">
              <div class="left">
                <span class="brand">
                  <span class="mark"><svg viewBox="0 0 2160 2160"><use href="#nv-iso"/></svg></span>
                  nevula
                </span>
                <span class="sep"></span>
                <span class="crumb">console</span>
                <span class="sep"></span>
                <span class="site">Oasis Residences &middot; Tower B</span>
              </div>
              <div class="right">
                <span class="pill alerts"><span class="dot"></span><span id="ppAlertCount">0</span> alerts</span>
                <span class="pill live"><span class="dot"></span>live</span>
                <span class="clock" id="ppClock">12:42:18</span>
              </div>
            </div>

            <div class="pp-rail">
              <button class="pp-fam" data-fam="0" type="button">
                <span class="ico"><svg viewBox="0 0 24 24"><path d="M12 3c1.5 4 5 5 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-8z"/></svg></span>
                <span class="nm">Fire</span>
              </button>
              <button class="pp-fam" data-fam="1" type="button">
                <span class="ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg></span>
                <span class="nm">Panic</span>
              </button>
              <button class="pp-fam" data-fam="2" type="button">
                <span class="ico"><svg viewBox="0 0 24 24"><path d="M6 4h9a3 3 0 0 1 3 3v13H6z"/><circle cx="14" cy="12" r="0.8" fill="currentColor"/></svg></span>
                <span class="nm">Access</span>
              </button>
              <button class="pp-fam" data-fam="3" type="button">
                <span class="ico"><svg viewBox="0 0 24 24"><path d="M3 13h4l2-5 4 10 2-5h6"/></svg></span>
                <span class="nm">Health</span>
              </button>
              <button class="pp-fam" data-fam="4" type="button">
                <span class="ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M9 21l1-7-3-2 2-5 4 2 3 2 3 4"/></svg></span>
                <span class="nm">Mobility</span>
              </button>
            </div>

            <div class="pp-grid" id="ppGrid" data-count="0">
              <div class="pp-empty" id="ppEmpty">
                <span class="arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M16 12H4"/><path d="M10 6l-6 6 6 6"/></svg>
                </span>
                <span>Link a device family</span>
              </div>

              <div class="pp-widget" data-fam="0">
                <div class="wh">
                  <span class="lhs">
                    <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1.5 4 5 5 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-8z"/></svg></span>
                    <span class="nm">Fire &middot; Zone Grid</span>
                  </span>
                  <span class="badge warn"><span class="dot"></span>2 alert</span>
                </div>
                <div class="count"><span class="n">24</span><span class="u">nodes</span></div>
                <div class="breakdown"><span class="ok">22 OK</span><span class="sep">&middot;</span><span class="alert">2 over-temp</span></div>
                <div class="list">
                  <div class="li"><span class="id">Z-A12</span><span class="meta">stairwell</span><span class="v">78&deg;F</span></div>
                  <div class="li"><span class="id">Z-B07</span><span class="meta">corridor</span><span class="v">84&deg;F</span></div>
                  <div class="li flag"><span class="id">Z-C04</span><span class="meta">elec. closet</span><span class="v">142&deg;F &uarr;</span></div>
                </div>
                <div class="spark">
                  <svg viewBox="0 0 100 32" preserveAspectRatio="none">
                    <path class="fill" d="M0 24 L8 22 L16 23 L24 20 L32 19 L40 18 L48 16 L56 17 L64 14 L72 12 L80 10 L88 8 L100 6 L100 32 L0 32 Z"/>
                    <path class="line" d="M0 24 L8 22 L16 23 L24 20 L32 19 L40 18 L48 16 L56 17 L64 14 L72 12 L80 10 L88 8 L100 6"/>
                  </svg>
                </div>
              </div>

              <div class="pp-widget" data-fam="1">
                <div class="wh">
                  <span class="lhs">
                    <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg></span>
                    <span class="nm">Panic &middot; Duress</span>
                  </span>
                  <span class="badge ok"><span class="dot"></span>standby</span>
                </div>
                <div class="count"><span class="n">18</span><span class="u">stations</span></div>
                <div class="breakdown"><span class="ok">17 armed</span><span class="sep">&middot;</span>last fired <span style="color:var(--ink-200)">14m</span></div>
                <div class="list">
                  <div class="li"><span class="id">12:38</span><span class="meta">STA-04 long-press</span><span class="v">cleared</span></div>
                  <div class="li"><span class="id">12:31</span><span class="meta">STA-11 test</span><span class="v">ok</span></div>
                  <div class="li"><span class="id">12:22</span><span class="meta">STA-07 button</span><span class="v">cleared</span></div>
                </div>
              </div>

              <div class="pp-widget" data-fam="2">
                <div class="wh">
                  <span class="lhs">
                    <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h9a3 3 0 0 1 3 3v13H6z"/><circle cx="14" cy="12" r="0.8" fill="currentColor"/></svg></span>
                    <span class="nm">Access &middot; Doors</span>
                  </span>
                  <span class="badge ok"><span class="dot"></span>3 open</span>
                </div>
                <div class="count"><span class="n">47</span><span class="u">doors</span></div>
                <div class="breakdown">44 closed<span class="sep">&middot;</span><span class="ok">3 propped</span></div>
                <div class="list">
                  <div class="li"><span class="id">DR-09</span><span class="meta">main &middot; open</span><span class="v">0m ago</span></div>
                  <div class="li"><span class="id">DR-22</span><span class="meta">service &middot; open</span><span class="v">4m ago</span></div>
                  <div class="li"><span class="id">DR-15</span><span class="meta">lobby &middot; close</span><span class="v">12m ago</span></div>
                </div>
              </div>

              <div class="pp-widget" data-fam="3">
                <div class="wh">
                  <span class="lhs">
                    <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h4l2-5 4 10 2-5h6"/></svg></span>
                    <span class="nm">Health &middot; Vitals</span>
                  </span>
                  <span class="badge warn"><span class="dot"></span>1 watch</span>
                </div>
                <div class="count"><span class="n">12</span><span class="u">residents</span></div>
                <div class="breakdown">avg HR <span style="color:var(--ink-200)">72bpm</span><span class="sep">&middot;</span>SpO&#8322; <span style="color:var(--ink-200)">97%</span></div>
                <div class="list">
                  <div class="li"><span class="id">R-04</span><span class="meta">resting</span><span class="v">68 bpm</span></div>
                  <div class="li flag"><span class="id">R-15</span><span class="meta">elevated</span><span class="v">102 bpm &uarr;</span></div>
                  <div class="li"><span class="id">R-22</span><span class="meta">walking</span><span class="v">88 bpm</span></div>
                </div>
                <div class="spark">
                  <svg viewBox="0 0 100 32" preserveAspectRatio="none">
                    <path class="line" d="M0 18 L6 18 L8 18 L10 8 L12 24 L14 18 L20 18 L26 18 L28 18 L30 6 L32 26 L34 18 L40 18 L48 18 L54 18 L56 10 L58 24 L60 18 L68 18 L74 18 L76 18 L78 4 L80 28 L82 18 L88 18 L100 18"/>
                  </svg>
                </div>
              </div>

              <div class="pp-widget" data-fam="4">
                <div class="wh">
                  <span class="lhs">
                    <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M9 21l1-7-3-2 2-5 4 2 3 2 3 4"/></svg></span>
                    <span class="nm">Mobility &middot; Gait</span>
                  </span>
                  <span class="badge warn"><span class="dot"></span>1 still</span>
                </div>
                <div class="count"><span class="n">8</span><span class="u">residents</span></div>
                <div class="breakdown">7 active<span class="sep">&middot;</span><span class="alert">1 stationary 38m</span></div>
                <div class="list">
                  <div class="li"><span class="id">R-04</span><span class="meta">walking &middot; hall</span><span class="v">active</span></div>
                  <div class="li"><span class="id">R-09</span><span class="meta">seated &middot; day rm</span><span class="v">2m ago</span></div>
                  <div class="li flag"><span class="id">R-12</span><span class="meta">no motion</span><span class="v">38m &#9888;</span></div>
                </div>
              </div>
            </div>

            <div class="pp-foot">
              <div class="left">
                <span class="families">families linked <span class="v" id="ppFamCount">0</span></span>
              </div>
              <div class="right">
                <span class="pq">refresh &middot; 2s</span>
                <span class="auto">auto-provisioned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `)
}
