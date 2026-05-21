import { htmlEl } from '../lib/dom'

/**
 * Audio toggle button (bottom-right).
 * Phase 2 mounts the button as a static element; Phase 6 wires it to the
 * drone. Until then clicks are no-ops (kept on-screen as part of the chrome
 * so the visual layout doesn't shift when audio lands).
 */
export function renderAudioButton(): HTMLElement {
  return htmlEl(`
    <button class="nv-audio is-muted" id="audioToggle" aria-label="Toggle ambient audio">
      <span class="bars">
        <span></span><span></span><span></span><span></span>
      </span>
    </button>
  `)
}
