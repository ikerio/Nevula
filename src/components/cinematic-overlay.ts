import '../styles/scrims.css'

/** Adds the subtle scanline overlay (.nv-cinematic-overlay) to the page. */
export function mountCinematicOverlay(): void {
  if (document.querySelector('.nv-cinematic-overlay')) return
  const el = document.createElement('div')
  el.className = 'nv-cinematic-overlay'
  el.setAttribute('aria-hidden', 'true')
  document.body.appendChild(el)
}
