/**
 * Plug & Play console — auto-loop sequencer for chapter 3.
 *
 * Ports the IIFE `ppInit()` from
 *   NevulaWebsiteDesign/landing/cinematic.html  (lines 1701–1829)
 *
 * Behavior:
 *   - On chapter 3 entering view, the demo starts from phase 0.
 *   - Auto-loop adds families in ORDER on STEP_MS beats: Fire, Access,
 *     Panic, Health, Mobility.
 *   - After all 5 are linked, holds for HOLD_MS, then resets and replays.
 *   - Clicking a rail button toggles that family manually and pauses the
 *     auto-loop for 8s.
 *   - Replay button resets immediately.
 *   - The grid's `data-count` drives the CSS-only "self-arranging" layout.
 */

import type { NvChapterEvent } from '../lib/events'

const ORDER = [0, 2, 1, 3, 4] as const  // Fire, Access, Panic, Health, Mobility
const ALERTS_PER_FAM = [2, 0, 0, 1, 1] as const
const STEP_MS = 1900
const HOLD_MS = 4200
const USER_PAUSE_MS = 8000
const CHAPTER_INDEX = 3

export interface PpConsoleHandle {
  reset(): void
  dispose(): void
}

export function initPpConsole(): PpConsoleHandle | null {
  const stage = document.getElementById('ppStage')
  if (!stage) return null

  const grid = document.getElementById('ppGrid') as HTMLElement
  const empty = document.getElementById('ppEmpty') as HTMLElement
  const replay = document.getElementById('ppReplay') as HTMLButtonElement | null
  const clockEl = document.getElementById('ppClock') as HTMLElement
  const alertEl = document.getElementById('ppAlertCount') as HTMLElement
  const famCount = document.getElementById('ppFamCount') as HTMLElement

  const widgets = Array.from(grid.querySelectorAll<HTMLElement>('.pp-widget'))
  const rail = Array.from(document.querySelectorAll<HTMLElement>('.pp-fam'))

  const active = new Set<number>()
  let stepIx = 0
  let userPauseUntil = 0
  let lastStepAt = performance.now()
  const pageStart = performance.now()
  let rafId = 0
  let disposed = false

  function applyState() {
    const count = active.size
    grid.dataset.count = String(count)
    empty.style.display = count === 0 ? 'flex' : 'none'
    famCount.textContent = String(count)
    let alerts = 0
    active.forEach(f => { alerts += ALERTS_PER_FAM[f] })
    alertEl.textContent = String(alerts)
    const order = [...active]
    widgets.forEach(w => {
      const fam = parseInt(w.dataset.fam ?? '0', 10)
      const isOn = active.has(fam)
      w.classList.toggle('is-active', isOn)
      if (isOn) w.dataset.rank = String(order.indexOf(fam))
    })
    rail.forEach(r => {
      const fam = parseInt(r.dataset.fam ?? '0', 10)
      r.classList.toggle('is-on', active.has(fam))
    })
  }

  function add(fam: number, fresh: boolean) {
    if (active.has(fam)) return
    active.add(fam)
    applyState()
    if (!fresh) return
    const widget = widgets.find(w => Number(w.dataset.fam) === fam)
    const railBtn = rail.find(r => Number(r.dataset.fam) === fam)
    if (widget) {
      widget.classList.remove('is-fresh')
      void widget.offsetWidth  // force reflow so the animation restarts
      widget.classList.add('is-fresh')
      window.setTimeout(() => widget.classList.remove('is-fresh'), 1500)
    }
    if (railBtn) {
      railBtn.classList.remove('is-arming')
      void railBtn.offsetWidth
      railBtn.classList.add('is-arming')
      window.setTimeout(() => railBtn.classList.remove('is-arming'), 800)
    }
  }

  function remove(fam: number) {
    if (!active.has(fam)) return
    active.delete(fam)
    applyState()
  }

  function reset() {
    active.clear()
    stepIx = 0
    applyState()
  }

  // ---- listeners ----
  const railListeners: Array<{ el: HTMLElement; fn: (e: Event) => void }> = []
  rail.forEach(r => {
    const fn = () => {
      const fam = Number(r.dataset.fam)
      if (active.has(fam)) remove(fam)
      else add(fam, true)
      userPauseUntil = performance.now() + USER_PAUSE_MS
    }
    r.addEventListener('click', fn)
    railListeners.push({ el: r, fn })
  })

  const replayFn = () => {
    reset()
    userPauseUntil = 0
    stepIx = 0
    lastStepAt = performance.now()
  }
  replay?.addEventListener('click', replayFn)

  const chapterFn = (e: NvChapterEvent) => {
    if (e.detail.index === CHAPTER_INDEX) {
      reset()
      lastStepAt = performance.now()
    }
  }
  window.addEventListener('nv:chapter', chapterFn)

  // ---- main loop ----
  function loop(now: number) {
    if (disposed) return
    if (now > userPauseUntil) {
      const since = now - lastStepAt
      if (stepIx < ORDER.length) {
        if (since >= STEP_MS) {
          add(ORDER[stepIx], true)
          stepIx++
          lastStepAt = now
        }
      } else if (since >= HOLD_MS) {
        reset()
        lastStepAt = now
      }
    }
    // Clock — operational, anchored at 12:42:18 + elapsed seconds.
    const base = 12 * 3600 + 42 * 60 + 18
    const sec = base + Math.floor((now - pageStart) / 1000)
    const hh = Math.floor(sec / 3600) % 24
    const mm = Math.floor(sec / 60) % 60
    const ss = sec % 60
    clockEl.textContent =
      String(hh).padStart(2, '0') + ':' +
      String(mm).padStart(2, '0') + ':' +
      String(ss).padStart(2, '0')
    rafId = requestAnimationFrame(loop)
  }

  applyState()
  rafId = requestAnimationFrame(loop)

  return {
    reset,
    dispose() {
      disposed = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('nv:chapter', chapterFn)
      replay?.removeEventListener('click', replayFn)
      railListeners.forEach(({ el, fn }) => el.removeEventListener('click', fn))
    },
  }
}
