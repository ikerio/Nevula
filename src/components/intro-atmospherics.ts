import { htmlEl } from '../lib/dom'

/**
 * Subtle decorative geometry that sits behind the wordmark during the intro
 * — concentric orbital rings, a huge sweeping arc, two dot grids, a
 * constellation network, plus marks, hairline scanner lines, and a few
 * "—•" indicator marks. Aesthetic target: blueprint / navigation chart.
 *
 * One SVG, 1920×1080 viewBox, scaled to viewport via CSS. Coordinates are
 * tuned so shapes hug the edges rather than crowd the wordmark.
 *
 * Each major group has a class (`atmos-*`) that CSS pairs with a per-group
 * opacity and an animation (slow rotation, drifting, twinkling, scanner
 * sweep). The animations are intentionally subtle and long-period so the
 * atmosphere reads as alive without competing with the wordmark.
 */
export function mountIntroAtmospherics(): HTMLElement {
  return htmlEl(`
    <svg
      class="intro-atmos"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <!-- HUGE upper-left orbital arc — sweeps faintly across the top half.
           Centered far off-screen so only the curve-segment is visible. -->
      <g class="atmos-big-arc" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="-400" cy="-200" r="1500"/>
        <circle cx="-400" cy="-200" r="1380" stroke-dasharray="3 9"/>
      </g>

      <!-- Right-side orbital cluster — four nested rings + center dot.
           Two are solid, two dashed so the rhythm reads as instrumentation. -->
      <g class="atmos-orbits" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="1820" cy="540" r="180"/>
        <circle cx="1820" cy="540" r="260" stroke-dasharray="2 6"/>
        <circle cx="1820" cy="540" r="360"/>
        <circle cx="1820" cy="540" r="460" stroke-dasharray="1 11"/>
        <circle cx="1820" cy="540" r="6" fill="currentColor" stroke="none"/>
        <!-- Two orbiting markers tucked on the ring perimeters -->
        <circle class="atmos-orbiter-a" cx="1820" cy="280" r="3" fill="currentColor" stroke="none"/>
        <circle class="atmos-orbiter-b" cx="2080" cy="540" r="3" fill="currentColor" stroke="none"/>
      </g>

      <!-- Bottom-left dot matrix — 11×7 fine grid, 18px pitch. Stays
           static; CSS animates a wave of opacity sweeping across it. -->
      <g class="atmos-grid" fill="currentColor">
        ${dotGrid(11, 7, 80, 800, 18)}
      </g>

      <!-- Top-right secondary dot patch — 5×3 sparse cells. -->
      <g class="atmos-grid-small" fill="currentColor">
        ${dotGrid(5, 3, 1620, 140, 16)}
      </g>

      <!-- Bottom-right constellation — 8 nodes with 9 interconnects. -->
      <g class="atmos-constellation" stroke="currentColor" stroke-width="0.75" fill="currentColor">
        <line x1="1240" y1="880" x2="1380" y2="820"/>
        <line x1="1380" y1="820" x2="1500" y2="900"/>
        <line x1="1500" y1="900" x2="1640" y2="860"/>
        <line x1="1640" y1="860" x2="1740" y2="780"/>
        <line x1="1380" y1="820" x2="1640" y2="860"/>
        <line x1="1240" y1="880" x2="1320" y2="970"/>
        <line x1="1500" y1="900" x2="1430" y2="980"/>
        <line x1="1740" y1="780" x2="1820" y2="860"/>
        <line x1="1820" y1="860" x2="1820" y2="540"/>
        <circle class="atmos-node" cx="1240" cy="880" r="2.5"/>
        <circle class="atmos-node" cx="1380" cy="820" r="2.5"/>
        <circle class="atmos-node" cx="1500" cy="900" r="2.5"/>
        <circle class="atmos-node" cx="1640" cy="860" r="2.5"/>
        <circle class="atmos-node" cx="1740" cy="780" r="2.5"/>
        <circle class="atmos-node" cx="1320" cy="970" r="2.5"/>
        <circle class="atmos-node" cx="1430" cy="980" r="2.5"/>
        <circle class="atmos-node" cx="1820" cy="860" r="2.5"/>
        <circle cx="1740" cy="780" r="14" fill="none" stroke-width="0.75"/>
      </g>

      <!-- Plus marks scattered — top, midline, lower-left. Each pulses
           on its own offset so the whole field shimmers irregularly. -->
      <g class="atmos-plus" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none">
        <g class="plus-mark" data-i="0" transform="translate(1480 120)"><line x1="-6" y1="0" x2="6" y2="0"/><line x1="0" y1="-6" x2="0" y2="6"/></g>
        <g class="plus-mark" data-i="1" transform="translate(1640 220)"><line x1="-8" y1="0" x2="8" y2="0"/><line x1="0" y1="-8" x2="0" y2="8"/></g>
        <g class="plus-mark" data-i="2" transform="translate(1780 90)"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/></g>
        <g class="plus-mark" data-i="3" transform="translate(960 80)"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/></g>
        <g class="plus-mark" data-i="4" transform="translate(560 920)"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/></g>
        <g class="plus-mark" data-i="5" transform="translate(740 160)"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/></g>
        <g class="plus-mark" data-i="6" transform="translate(1240 60)"><line x1="-4" y1="0" x2="4" y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/></g>
      </g>

      <!-- Left satellite — ring with three orbiting dots; ring counter-
           rotates against the right-cluster orbits. -->
      <g class="atmos-satellite" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="180" cy="380" r="36"/>
        <circle cx="180" cy="380" r="2" fill="currentColor" stroke="none"/>
        <circle cx="220" cy="340" r="2" fill="currentColor" stroke="none"/>
        <circle cx="120" cy="420" r="2" fill="currentColor" stroke="none"/>
        <circle cx="216" cy="408" r="2" fill="currentColor" stroke="none"/>
      </g>

      <!-- Indicator marks — short hairline with a terminating dot. Three
           of these scattered as instrumentation labels would sit. -->
      <g class="atmos-indicator" stroke="currentColor" stroke-width="1" fill="currentColor">
        <g transform="translate(120 220)"><line x1="0" y1="0" x2="60" y2="0"/><circle cx="60" cy="0" r="2"/></g>
        <g transform="translate(1320 160)"><line x1="0" y1="0" x2="44" y2="0"/><circle cx="44" cy="0" r="2"/></g>
        <g transform="translate(1240 1020)"><line x1="0" y1="0" x2="56" y2="0"/><circle cx="56" cy="0" r="2"/></g>
      </g>

      <!-- Diagonal scanner hairline — sweeps across the screen on a long
           cycle. Drawn off-screen at rest, CSS translates it across. -->
      <g class="atmos-scanner" stroke="currentColor" stroke-width="0.6" stroke-dasharray="80 12 4 12">
        <line x1="-200" y1="540" x2="2120" y2="540"/>
      </g>
    </svg>
  `)
}

/** Generate a grid of `<circle r=1.5>` markup. Inline string so the SVG
 *  template above stays a single htmlEl call without runtime iteration. */
function dotGrid(cols: number, rows: number, x0: number, y0: number, pitch: number): string {
  let out = ''
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out += `<circle cx="${x0 + c * pitch}" cy="${y0 + r * pitch}" r="1.5"/>`
    }
  }
  return out
}
