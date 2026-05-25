import { htmlEl } from '../lib/dom'
import { openFounderDossier, initFounderDossier, type FounderDossierHandle } from './ch-5-dossier'
import '../styles/chapters/ch-5.css'

/**
 * Chapter 5 — Founders (rail label "08 Founders").
 *
 * Adapts the standalone study at `NevulaWebsiteDesign/Founder Card
 * _standalone_.html`. Three discrete states per card:
 *
 *   • Resting — index, role pill, portrait placeholder, name + tagline,
 *               past-companies strip, OPEN ↗ CTA.
 *   • Hover   — orange rail anchors the left edge, the card lifts, a
 *               sheen passes across the portrait, and two key metrics
 *               slide in above the foot row.
 *   • Open    — clicking the card (or OPEN) reveals a full-screen
 *               dossier: left preview panel + right body with bio,
 *               three-entry track record, and three headline stats.
 *               Closes via Esc or ×.
 */

export interface FounderStat {
  /** Display value, e.g. "$1.4B" or "12 ctry". */
  value: string
  /** Small caption beneath the value, e.g. "ARR scaled". */
  label: string
}

export interface TrackEntry {
  company: string
  /** Display string for the date range, e.g. "2018 — 2024". */
  range: string
  description: string
}

export interface Founder {
  /** Two-digit index, "01"..."04". */
  index: string
  /** Short role label, ALL-CAPS in the top-right pill. */
  role: string
  name: string
  /** One-line credential under the name. */
  tagline: string
  /** Past companies — shown as a mono-caps list in the foot row. */
  pastCompanies: string[]
  /** Longer bio paragraph for the dossier body. */
  bio: string
  /** Career timeline. Renders as a numbered list in the dossier. */
  trackRecord: TrackEntry[]
  /** Three headline stats. The first two render on the card hover; all
   *  three render in the dossier footer. */
  stats: [FounderStat, FounderStat, FounderStat]
  /** Public path to the portrait PNG (cutout on transparent bg). The card
   *  and dossier render an <img> over the cobalt gradient; on load error,
   *  `.pmissing` placeholder shows through via the `p-failed` CSS branch. */
  portrait: string
}

// Real Nevula founders from the May 2026 investor pitch (PDF p.15). Jorge
// is the technical founder (XPECTRA, 1995); German leads as CEO. Bios use
// only PDF-confirmed facts; soft fields carry TBD-NOTE markers for later
// refinement. See NevulaResources/INVESTOR_REWRITE_PLAN.md for the full
// rationale and source quotes.
export const FOUNDERS: Founder[] = [
  {
    index: '01',
    role: 'CEO',
    name: 'German Perez-Duarte',
    tagline: 'Continental operator. Scaling LatAm businesses at hyperscale.',
    pastCompanies: ['Amazon', 'Uber Eats', 'Microsoft', 'Nielsen'],
    bio:
      'German has led country-scale operations across Latin America — as Country Manager for Amazon Mexico and Head of LatAm for Uber Eats, with earlier leadership at Microsoft and Nielsen. At Nevula he owns strategy, growth, and the path to enterprise.',
    trackRecord: [
      {
        company: 'Amazon',
        range: 'Recent', // TBD-NOTE: confirm Amazon Mexico tenure years
        description:
          'Country Manager, Amazon Mexico. Led the country business across marketplace, logistics, and commercial operations.',
      },
      {
        company: 'Uber Eats',
        range: 'Earlier', // TBD-NOTE: confirm Uber Eats date range
        description:
          'Head of LatAm. Scaled the regional business across multiple country markets.',
      },
      {
        company: 'Microsoft · Nielsen',
        range: 'Earlier career',
        description:
          'Leadership roles spanning commercial expansion and consumer insight across the region.',
      },
    ],
    stats: [
      { value: 'Amazon MX', label: 'Country lead' },
      { value: 'LatAm', label: 'Uber Eats head' },
      { value: '20+ yrs', label: 'Operating' }, // TBD-NOTE: tighten years
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/german.png`,
  },
  {
    index: '02',
    role: 'CTO',
    name: 'Jorge Cesin',
    tagline: '30 years building security infrastructure across LatAm.',
    pastCompanies: ['XPECTRA', 'netMATRIX'],
    bio:
      'Jorge founded XPECTRA in 1995 and spent three decades building one of the largest security and IoT operations in Latin America — deploying over five million sensors and shipping more than $35M in contracts. At Nevula he owns the platform: ingestion, orchestration, and the device fabric.',
    trackRecord: [
      {
        company: 'XPECTRA',
        range: '1995 — 2024',
        description:
          'Founder. Built and scaled XPECTRA to 5M+ sensors deployed and $35M+ in contracts across LatAm.',
      },
      {
        company: 'netMATRIX',
        range: '2024 — 2025',
        description:
          'Led the ideation and engineering effort that turned netMATRIX into the foundation of Nevula.',
      },
      {
        company: 'Nevula Tech Inc.',
        range: '2025 — present',
        description:
          'CTO & Founder. Owns the orchestration platform end-to-end — workflow engine, AI, and device fabric.',
      },
    ],
    stats: [
      { value: '5M+', label: 'Sensors deployed' },
      { value: '30 yrs', label: 'Security & IoT' },
      { value: '$35M+', label: 'Contracts shipped' },
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/jorge.png`,
  },
  {
    index: '03',
    role: 'CDO',
    name: 'Carlos Urgelles',
    tagline: 'Built and exited Pabis Retail to Accel-KKR.',
    pastCompanies: ['Pabis Retail', 'Accel-KKR'],
    bio:
      'Carlos founded and led Pabis Retail as CEO through its acquisition by Accel-KKR in 2023. He has spent his career building and operating technology businesses across the region. At Nevula he owns commercial strategy — partnerships, GTM, and the integrator channel.',
    trackRecord: [
      {
        company: 'Pabis Retail',
        range: 'Founded — 2023', // TBD-NOTE: confirm founding year
        description:
          'Founder & CEO. Built the company end-to-end through its acquisition by Accel-KKR in 2023.',
      },
      {
        company: 'Accel-KKR',
        range: '2023 — present',
        description:
          'Continued leadership post-acquisition at the Accel-KKR portfolio.', // TBD-NOTE: clarify post-acquisition scope
      },
      {
        company: 'Earlier ventures',
        range: 'Earlier career',
        description:
          'Operating and founding roles in technology and retail across LatAm.', // TBD-NOTE: name specific prior companies if approved
      },
    ],
    stats: [
      { value: '1', label: 'Exit (Accel-KKR)' },
      { value: 'Founder', label: 'Pabis Retail' },
      { value: 'LatAm', label: 'Operator' }, // TBD-NOTE: replace w/ concrete number
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/carlos.png`,
  },
  {
    index: '04',
    role: 'CMO',
    name: 'Hector Ruvalcaba',
    tagline: 'Brand strategist. Mexico Entrepreneur of the Year.',
    pastCompanies: ['Mexico EOY', 'MIT Fire Hydrant'],
    bio:
      'Hector is a PR and marketing strategist recognized as Mexico Entrepreneur of the Year and an MIT Fire Hydrant Award honoree. At Nevula he owns brand, marketing, and category positioning.',
    trackRecord: [
      {
        company: 'Mexico Entrepreneur of the Year',
        range: 'National award',
        description:
          'Recognized for entrepreneurial leadership in Mexico.', // TBD-NOTE: confirm award year + governing body
      },
      {
        company: 'MIT Fire Hydrant Award',
        range: 'Recognition',
        description:
          'MIT honoree for contribution to industry innovation.', // TBD-NOTE: confirm award context + year
      },
      {
        company: 'Earlier career',
        range: 'PR · Marketing',
        description:
          'Senior brand and communications leadership across consumer and enterprise categories.', // TBD-NOTE: list specific agency or brand engagements
      },
    ],
    stats: [
      { value: 'EOY', label: 'Mexico' },
      { value: 'MIT', label: 'Fire Hydrant' },
      { value: 'Brand', label: 'Strategist' }, // TBD-NOTE: replace w/ concrete number
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/hector.png`,
  },
]

/** Renders a single founder card. Markup matches the resting state from
 *  the concept; the hover affordances (.fc-stats slide-in, .fc-rail
 *  reveal, .fc-sheen pass) are pure CSS, driven by `.fc:hover`. */
function renderCard(f: Founder, i: number): string {
  const [s1, s2] = f.stats
  // Past companies are joined inline with a styled "·" separator so the
  // ellipsis truncates the whole string as one (per concept's `.fc .past`).
  const pastHtml = f.pastCompanies
    .map((c, idx) => (idx === 0 ? c : `<span class="sep">&middot;</span>${c}`))
    .join('')
  return `
    <div class="fc-wrap" style="--n: ${i}">
      <article class="fc" data-index="${f.index}" tabindex="0" role="button"
               aria-label="Open ${f.name} dossier">
        <div class="portrait" aria-hidden="true">
          <img class="pimg" src="${f.portrait}" alt=""
               onerror="this.classList.add('p-failed')">
          <div class="pmissing">
            <span class="pmissing-circle"></span>
            <span class="pmissing-label">Portrait pending</span>
          </div>
          <span class="sweep"></span>
          <span class="pix">${f.index}</span>
          <span class="prole">Founder &middot; ${f.role}</span>
          <div class="pcap">
            <span class="pcap-left">
              <span class="dot"></span>Nevula &middot; Dossier
            </span>
            <span class="pcap-right">2026</span>
          </div>
        </div>

        <div class="meta">
          <h4 class="name">${f.name}</h4>
          <p class="tag">${f.tagline}</p>

          <div class="metrics" aria-hidden="true">
            <div class="m"><span class="v">${s1.value}</span><span class="l">${s1.label}</span></div>
            <div class="m"><span class="v">${s2.value}</span><span class="l">${s2.label}</span></div>
          </div>

          <div class="foot">
            <span class="past">${pastHtml}</span>
            <span class="open">
              <span>Open</span>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 11L11 5M7 5h4v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
      </article>
    </div>
  `
}

export function renderChapter5(): HTMLElement {
  const root = htmlEl(`
    <section class="nv-chapter ch-5" data-chapter="9" data-screen-label="09 Founders">
      <div class="layout">
        <div class="ch5-head">
          <div class="nv-eyebrow">
            <span class="num">09</span>
            <span class="bar"></span>
            <span>The Team</span>
          </div>
          <h2 class="nv-title size-l">
            100+ years of<br/><em>building &amp; scaling.</em>
          </h2>
          <p class="nv-lede">
            Our founders have led global operations at Amazon, Microsoft, and
            Uber Eats &mdash; each surpassing $1B in annual revenue under their
            leadership &mdash; and shaped startup ecosystems across Latin America.
          </p>
        </div>

        <div class="founder-grid">
          ${FOUNDERS.map(renderCard).join('')}
        </div>
      </div>
    </section>
  `)

  // Event delegation on the grid — clicking the card body (or pressing
  // Enter / Space while focused) opens the dossier. The card itself is
  // the activation target, not the OPEN affordance, so the entire surface
  // is hit-targetable (matches the user's "Click to open" affordance in
  // the concept).
  const grid = root.querySelector('.founder-grid')!
  const triggerByEvent = (e: Event): void => {
    const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('.fc')
    if (!card) return
    const i = FOUNDERS.findIndex(f => f.index === card.dataset.index)
    if (i < 0) return
    e.preventDefault()
    openFounderDossier(FOUNDERS[i])
  }
  grid.addEventListener('click', triggerByEvent)
  grid.addEventListener('keydown', (e: Event) => {
    const ke = e as KeyboardEvent
    if (ke.key === 'Enter' || ke.key === ' ') triggerByEvent(ke)
  })

  return root
}

/** Init the dossier overlay container + global handlers (Esc, backdrop
 *  click). Called once from main.ts; returns a dispose() for HMR. */
export function initFounderChapter(): FounderDossierHandle {
  return initFounderDossier()
}
