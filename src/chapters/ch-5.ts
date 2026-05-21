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
}

export const FOUNDERS: Founder[] = [
  {
    index: '01',
    role: 'CEO',
    name: 'Camila Restrepo',
    tagline: 'Growth strategy & international expansion.',
    pastCompanies: ['Amazon', 'Microsoft', 'Uber Eats'],
    bio:
      'Camila has led global operations at Amazon and shaped startup ecosystems across Latin America — taking new categories from launch to $1B+ ARR and building the GTM org behind expansion into twelve markets. At Nevula she owns growth, partnerships, and the path to enterprise.',
    trackRecord: [
      {
        company: 'Amazon',
        range: '2018 — 2024',
        description: 'VP, LatAm Operations. Scaled four marketplaces past $1B in annual revenue.',
      },
      {
        company: 'Microsoft',
        range: '2014 — 2018',
        description: 'Director, Commercial Expansion. Opened seven new country offices across the region.',
      },
      {
        company: 'McKinsey & Co.',
        range: '2010 — 2014',
        description: 'Engagement Manager, TMT practice. Advised infrastructure operators across LatAm.',
      },
    ],
    stats: [
      { value: '$1.4B', label: 'ARR scaled' },
      { value: '12 ctry', label: 'Markets' },
      { value: '900', label: 'Teams led' },
    ],
  },
  {
    index: '02',
    role: 'CTO',
    name: 'Mateo Vargas',
    tagline: 'IoT platforms & analytics at hyperscale.',
    pastCompanies: ['Amazon', 'Mercado Libre'],
    bio:
      'Mateo built the analytics and IoT systems behind one of the largest marketplaces in the region, handling billions of edge events per day. Before Mercado Libre he led infrastructure teams at Amazon. At Nevula he owns the platform — ingestion, model serving, and the device fabric.',
    trackRecord: [
      {
        company: 'Mercado Libre',
        range: '2019 — 2024',
        description: 'Principal Engineer, Data Platform. Designed the real-time inference pipeline behind core marketplace ranking.',
      },
      {
        company: 'Amazon',
        range: '2013 — 2019',
        description: 'Senior Engineering Manager, AWS IoT. Built device-fleet management used by industrial customers.',
      },
      {
        company: 'Globant',
        range: '2009 — 2013',
        description: 'Tech Lead. Shipped backend systems for retail and media clients in the US and EMEA.',
      },
    ],
    stats: [
      { value: '3.2B', label: 'Events / day' },
      { value: '180+', label: 'Engineers led' },
      { value: '14', label: 'Patents' },
    ],
  },
  {
    index: '03',
    role: 'COO',
    name: 'Lucía Ferreira',
    tagline: 'Multi-region operations & go-to-market.',
    pastCompanies: ['Microsoft', 'Uber Eats'],
    bio:
      'Lucía has run multi-region operations across Latin America for over a decade — scaling Uber Eats from launch into a $1B regional business and rebuilding Microsoft\'s partner channel across eight countries. At Nevula she owns delivery, partnerships, and the field network.',
    trackRecord: [
      {
        company: 'Uber Eats',
        range: '2017 — 2023',
        description: 'Regional GM, LatAm. Launched in five countries and scaled the business past $1B in annual GMV.',
      },
      {
        company: 'Microsoft',
        range: '2011 — 2017',
        description: 'Director, Partner Channel. Rebuilt the partner program across eight countries.',
      },
      {
        company: 'Bain & Company',
        range: '2007 — 2011',
        description: 'Manager, Consumer & Retail practice. Led GTM engagements for global brands in the region.',
      },
    ],
    stats: [
      { value: '$1.1B', label: 'GMV scaled' },
      { value: '8 ctry', label: 'Markets opened' },
      { value: '2.4K', label: 'Field ops' },
    ],
  },
  {
    index: '04',
    role: 'CFO',
    name: 'Andrés Pinto',
    tagline: 'Corporate development & venture investing.',
    pastCompanies: ['Kaszek', 'Globant'],
    bio:
      'Andrés built and exited multiple LatAm technology businesses before turning to venture investing at Kaszek, where he led growth-stage deals across SaaS and fintech. At Nevula he owns finance, capital strategy, and corporate development.',
    trackRecord: [
      {
        company: 'Kaszek',
        range: '2019 — 2024',
        description: 'Principal. Led growth-stage investments in SaaS, fintech, and B2B platforms.',
      },
      {
        company: 'Globant',
        range: '2014 — 2019',
        description: 'VP, Corporate Development. Closed nine acquisitions and the company\'s secondary offering.',
      },
      {
        company: 'BBVA',
        range: '2008 — 2014',
        description: 'Director, M&A. Advised on fintech and infrastructure deals across South America.',
      },
    ],
    stats: [
      { value: '$320M', label: 'Capital deployed' },
      { value: '17', label: 'Deals closed' },
      { value: '4', label: 'Exits' },
    ],
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
    <section class="nv-chapter ch-5" data-chapter="8" data-screen-label="08 Founders">
      <div class="layout">
        <div class="ch5-head">
          <div class="nv-eyebrow">
            <span class="num">08</span>
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
