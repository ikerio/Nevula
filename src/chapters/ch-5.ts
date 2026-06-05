import { htmlEl } from '../lib/dom'
import { openFounderDossier, initFounderDossier, type FounderDossierHandle } from './ch-5-dossier'
import '../styles/chapters/ch-5.css'

/**
 * Chapter 5 — Founders (rail label "04 Founders").
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
  /** Two-digit index, "01"..."05". */
  index: string
  /** Short role label, ALL-CAPS in the top-right pill. */
  role: string
  /** Founder vs co-founder — prefixes the role in the pill + dossier header. */
  kind: 'Founder' | 'Co-founder'
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

// Nevula founders — refreshed 2026-06 from the team slide the user provided
// (5 cards incl. Jenny Pinto, CFO). Jorge is the sole technical founder; the
// rest are co-founders. Bios + track records are synthesized from the slide's
// bullet credentials.
export const FOUNDERS: Founder[] = [
  {
    index: '01',
    role: 'CEO',
    kind: 'Co-founder',
    name: 'German Perez-Duarte',
    tagline: '25 years scaling $1B+ tech businesses across LatAm.',
    pastCompanies: ['Amazon', 'Uber', 'Microsoft', 'Nielsen'],
    bio:
      'German has spent 25 years scaling $1B+ technology businesses across Latin America — as Country Manager for Amazon Mexico and Head of LatAm for Uber, with earlier leadership at Microsoft and Nielsen. A Wharton MBA (1996) with MIT executive programs in AI, Digital Transformation and Agentic AI (2024, 2026), and an MIT Fire Hydrant Award honoree (2024). At Nevula he owns strategy, growth, and the path to enterprise.',
    trackRecord: [
      {
        company: 'Amazon Mexico',
        range: 'Country Manager',
        description:
          'Led the Amazon Mexico country business across marketplace, logistics, and commercial operations.',
      },
      {
        company: 'Uber · Microsoft · Nielsen',
        range: 'LatAm leadership',
        description:
          'Head of LatAm at Uber, with earlier regional leadership at Microsoft and Nielsen.',
      },
      {
        company: 'Wharton · MIT',
        range: '1996 · 2024–26',
        description:
          'Wharton MBA (1996); MIT executive programs in AI, Digital Transformation & Agentic AI (2024, 2026); MIT Fire Hydrant Award (2024).',
      },
    ],
    stats: [
      { value: '25 yrs', label: 'Scaling $1B+' },
      { value: 'Amazon MX', label: 'Country lead' },
      { value: 'Uber', label: 'Head of LatAm' },
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/german.png`,
  },
  {
    index: '02',
    role: 'CTO',
    kind: 'Founder',
    name: 'Jorge Cesin',
    tagline: '30 years in security & IoT. Founder of Xpectra.',
    pastCompanies: ['Xpectra', 'SKU', 'MIT'],
    bio:
      'Jorge has 30 years in security and IoT. He founded Xpectra, a leading banking-monitoring platform, and SKU, a technology logistics venture. An MIT AI / Digital Transformation alumnus and MIT Fire Hydrant Award honoree (2024). At Nevula he owns the platform end-to-end — ingestion, orchestration, and the device fabric.',
    trackRecord: [
      {
        company: 'Xpectra',
        range: 'Founder',
        description: 'Founder of Xpectra, a leading banking-monitoring platform.',
      },
      {
        company: 'SKU',
        range: 'Founder',
        description: 'Founder of SKU, a technology logistics venture.',
      },
      {
        company: 'MIT',
        range: '2024',
        description: 'MIT AI / Digital Transformation; MIT Fire Hydrant Award (2024).',
      },
    ],
    stats: [
      { value: '30 yrs', label: 'Security & IoT' },
      { value: 'Xpectra', label: 'Founder' },
      { value: 'SKU', label: 'Founder' },
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/jorge.png`,
  },
  {
    index: '03',
    role: 'CDAO',
    kind: 'Co-founder',
    name: 'Carlos Urgelles',
    tagline: 'Data & analytics leader. Founder & CEO of Pabis Retail.',
    pastCompanies: ['Pabis Retail', 'Teamcore', 'Accel-KKR'],
    bio:
      'Carlos is a data analytics and platforms expert. He founded and led Pabis Retail as CEO; the startup was acquired by Teamcore — backed by Accel-KKR — in 2023. At Nevula he owns data, analytics, and the intelligence layer.',
    trackRecord: [
      {
        company: 'Pabis Retail',
        range: 'Founder & CEO',
        description: 'Founder and CEO of Pabis Retail.',
      },
      {
        company: 'Teamcore',
        range: '2023',
        description: 'Pabis Retail acquired by Teamcore (backed by Accel-KKR) in 2023.',
      },
      {
        company: 'Data & Analytics',
        range: 'Expertise',
        description: 'Data analytics and platforms expert across LatAm.',
      },
    ],
    stats: [
      { value: 'Pabis', label: 'Founder & CEO' },
      { value: '2023', label: 'Acquired · Teamcore' },
      { value: 'Accel-KKR', label: 'Backed' },
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/carlos.png`,
  },
  {
    index: '04',
    role: 'CMO',
    kind: 'Co-founder',
    name: 'Hector Ruvalcaba',
    tagline: 'PR & marketing strategist. Founder of The bbit group.',
    pastCompanies: ['The bbit group', 'Jalisco EOY', 'MIT'],
    bio:
      'Hector is a PR and marketing strategist and founder of The bbit group. Winner of the Jalisco Entrepreneur award (2024) and an MIT Fire Hydrant Award honoree (2024). At Nevula he owns brand, marketing, and category positioning.',
    trackRecord: [
      {
        company: 'The bbit group',
        range: 'Founder',
        description: 'Founder of The bbit group — PR and marketing.',
      },
      {
        company: 'Jalisco Entrepreneur',
        range: '2024',
        description: 'Winner of the Jalisco Entrepreneur award (2024).',
      },
      {
        company: 'MIT Fire Hydrant',
        range: '2024',
        description: 'MIT Fire Hydrant Award honoree (2024).',
      },
    ],
    stats: [
      { value: 'The bbit', label: 'Founder' },
      { value: 'Jalisco', label: 'Entrepreneur 2024' },
      { value: 'MIT', label: 'Fire Hydrant' },
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/hector.png`,
  },
  {
    index: '05',
    role: 'CFO',
    kind: 'Co-founder',
    name: 'Jenny Pinto',
    tagline: '25 years of financial expertise. CFO of Xpectra.',
    pastCompanies: ['Xpectra', 'Finance'],
    bio:
      'Jenny brings 25 years of financial expertise and serves as CFO of Xpectra. At Nevula she owns finance — capital allocation, planning, and operations.',
    trackRecord: [
      {
        company: 'Xpectra',
        range: 'CFO',
        description: 'Chief Financial Officer of Xpectra.',
      },
      {
        company: 'Finance',
        range: '25 yrs',
        description: '25 years of financial leadership and operations.',
      },
    ],
    stats: [
      { value: '25 yrs', label: 'Financial expertise' },
      { value: 'Xpectra', label: 'CFO' },
      { value: 'Finance', label: 'Capital & ops' },
    ],
    portrait: `${import.meta.env.BASE_URL}assets/founders/Jenny.png`,
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
          <span class="prole">${f.kind} &middot; ${f.role}</span>
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
    <section class="nv-chapter ch-5" data-chapter="4" data-screen-label="04 Founders">
      <div class="layout">
        <div class="ch5-head">
          <div class="nv-eyebrow">
            <span class="num">04</span>
            <span class="bar"></span>
            <span>The Team</span>
          </div>
          <h2 class="nv-title size-l">
            100+ years of<br/><em>building &amp; scaling.</em>
          </h2>
          <p class="nv-lede">
            Our founders have led global operations at Amazon, Microsoft, and
            Uber &mdash; each surpassing $1B in annual revenue under their
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
