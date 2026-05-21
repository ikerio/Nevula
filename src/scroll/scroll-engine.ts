import { clamp, lerp } from '../lib/math'
import { dispatchChapterChange } from '../lib/events'
import type {
  ChapterConfig,
  NevulaScrollOptions,
  ScrollState,
} from './types'

/**
 * Smooth-scrub timeline that drives container intensities + chapter changes.
 *
 * Mounts an invisible scroll spacer (N * perChapterVh vh tall), watches scroll,
 * and converts to:
 *   - progress 0..1
 *   - t = progress * (N - 1)        — chapter timeline coord
 *   - per-chapter intensity         — plateau curve with narrow crossfade
 *   - CSS vars on chapter elements  — --i, --d, --pre, --post
 *   - CSS vars on :root             — --scroll-t, --chapter-t
 *   - 'nv:chapter' window event     — fires on dominant chapter change
 *   - onChapterChange callback      — for non-event subscribers (particle field)
 */
export class NevulaScroll {
  private chapters: ChapterConfig[]
  private N: number
  private opts: Required<
    Pick<NevulaScrollOptions, 'perChapterVh' | 'lerpSpeed' | 'snap'>
  > & Pick<NevulaScrollOptions, 'onChapterChange' | 'onProgress' | 'container'>

  private spacer: HTMLElement
  private chapterElGroups: NodeListOf<Element>[] = []
  private navEls: NodeListOf<Element>
  private railDots: NodeListOf<Element>

  private state = {
    progress: 0,
    target: 0,
    t: 0,
    currentIndex: -1,
    lastScroll: 0,
    snapTarget: null as number | null,
    lastTick: 0,
  }

  private rafId = 0
  private heartbeatId = 0
  private boundScroll = this.readScroll.bind(this)

  constructor(opts: NevulaScrollOptions) {
    this.chapters = opts.chapters
    this.N = opts.chapters.length
    this.opts = {
      container: opts.container ?? document,
      perChapterVh: opts.perChapterVh ?? 180,
      lerpSpeed: opts.lerpSpeed ?? 1.0,
      snap: opts.snap ?? false,
      onChapterChange: opts.onChapterChange,
      onProgress: opts.onProgress,
    }

    this.spacer = this.ensureSpacer()
    this.applySpacerHeight()

    const root: Document | HTMLElement =
      this.opts.container === document ? document : (this.opts.container as HTMLElement)
    for (let i = 0; i < this.N; i++) {
      this.chapterElGroups.push(
        root.querySelectorAll(`[data-chapter="${i}"]`),
      )
    }
    this.navEls = root.querySelectorAll('[data-nav-show]')
    this.railDots = root.querySelectorAll('[data-rail-dot]')

    window.addEventListener('scroll', this.boundScroll, { passive: true })
    window.addEventListener('resize', this.boundScroll)
    this.readScroll()
    this.rafId = requestAnimationFrame(this.tick)

    // Heartbeat fallback for tabs where RAF gets throttled.
    this.heartbeatId = window.setInterval(() => {
      if (performance.now() - this.state.lastTick > 200) this.tick()
    }, 250)
  }

  jumpTo(i: number): void {
    const target = i / (this.N - 1)
    const max = this.spacer.offsetHeight - window.innerHeight
    window.scrollTo({ top: target * max, behavior: 'smooth' })
  }

  get progress(): number { return this.state.progress }
  get t(): number { return this.state.t }
  get currentIndex(): number { return this.state.currentIndex }

  dispose(): void {
    window.removeEventListener('scroll', this.boundScroll)
    window.removeEventListener('resize', this.boundScroll)
    cancelAnimationFrame(this.rafId)
    clearInterval(this.heartbeatId)
    this.spacer.remove()
  }

  // ------------------------------------------------------------------ private

  private ensureSpacer(): HTMLElement {
    let spacer = document.querySelector<HTMLElement>('.nv-scroll-spacer')
    if (!spacer) {
      spacer = document.createElement('div')
      spacer.className = 'nv-scroll-spacer'
      spacer.setAttribute('aria-hidden', 'true')
      document.body.appendChild(spacer)
    }
    return spacer
  }

  private applySpacerHeight(): void {
    this.spacer.style.cssText =
      `position:relative;width:1px;height:${this.N * this.opts.perChapterVh}vh;pointer-events:none;`
  }

  private readScroll(): void {
    const max = Math.max(1, this.spacer.offsetHeight - window.innerHeight)
    this.state.target = clamp(window.scrollY / max, 0, 1)
    this.state.lastScroll = performance.now()
    this.state.snapTarget = null
    // Direct tick on scroll — guarantees the chapter responds even if RAF is
    // throttled. With lerpSpeed=1.0 this is 1:1 with scroll position.
    this.tick()
  }

  private setDominantChapter(idx: number): void {
    if (idx === this.state.currentIndex) return
    const prev = this.state.currentIndex
    this.state.currentIndex = idx
    const c = this.chapters[idx]
    this.opts.onChapterChange?.(idx, c, prev)
    dispatchChapterChange({ index: idx, key: c.key, prev })
  }

  private tick = (): void => {
    // Smooth target → progress (with lerpSpeed=1.0 this is identity).
    this.state.progress += (this.state.target - this.state.progress) * this.opts.lerpSpeed

    // Optional snap when user has been idle for >380ms.
    if (this.opts.snap && performance.now() - this.state.lastScroll > 380) {
      const t = this.state.progress * (this.N - 1)
      const nearest = Math.round(t)
      if (this.state.snapTarget == null) this.state.snapTarget = nearest / (this.N - 1)
      this.state.target = lerp(this.state.target, this.state.snapTarget, 0.06)
    }

    this.state.t = this.state.progress * (this.N - 1)

    // Root CSS vars for any global overlays.
    const docStyle = document.documentElement.style
    docStyle.setProperty('--scroll-t', this.state.progress.toFixed(4))
    docStyle.setProperty('--chapter-t', this.state.t.toFixed(4))

    // Dominant chapter (round-with-hysteresis).
    const dom = clamp(Math.round(this.state.t), 0, this.N - 1)
    this.setDominantChapter(dom)

    // Plateau curve — each chapter holds intensity=1 across the bulk of its
    // lane (dist 0..PLATEAU). Narrow crossfade window (PLATEAU..FADE) is the
    // only place two chapters are simultaneously visible.
    const PLATEAU = 0.40
    const FADE = 0.60
    const SLOPE = 1 / (FADE - PLATEAU)
    for (let i = 0; i < this.N; i++) {
      const signed = this.state.t - i
      const dist = Math.abs(signed)
      const intensity = clamp(1 - Math.max(0, dist - PLATEAU) * SLOPE, 0, 1)
      const shift = signed === 0 ? 0 : Math.sign(signed) * Math.max(0, dist - PLATEAU)
      const pre = signed < 0 ? intensity : 1
      const post = signed > 0 ? 1 - intensity : 0
      const iStr = intensity.toFixed(3)
      const dStr = shift.toFixed(3)
      const preStr = pre.toFixed(3)
      const postStr = post.toFixed(3)
      const els = this.chapterElGroups[i]
      for (let k = 0; k < els.length; k++) {
        const el = els[k] as HTMLElement & {
          __nvI?: string; __nvD?: string; __nvPre?: string; __nvPost?: string; __nvPe?: string
        }
        if (el.__nvI !== iStr) { el.style.setProperty('--i', iStr); el.__nvI = iStr }
        if (el.__nvD !== dStr) { el.style.setProperty('--d', dStr); el.__nvD = dStr }
        if (el.__nvPre !== preStr) { el.style.setProperty('--pre', preStr); el.__nvPre = preStr }
        if (el.__nvPost !== postStr) { el.style.setProperty('--post', postStr); el.__nvPost = postStr }
        const pe = intensity > 0.5 ? 'auto' : 'none'
        if (el.__nvPe !== pe) { el.style.pointerEvents = pe; el.__nvPe = pe }
      }
    }

    // Nav fade — visible only on chapters listed in data-nav-show="1,2,3".
    this.navEls.forEach(navEl => {
      const allow = navEl.getAttribute('data-nav-show')!.split(',').map(Number)
      let nav = 0
      for (const i of allow) {
        const d = Math.abs(this.state.t - i)
        nav = Math.max(nav, clamp(1 - Math.max(0, d - PLATEAU) * SLOPE, 0, 1))
      }
      const navStr = nav.toFixed(3)
      const _el = navEl as HTMLElement & { __nvShow?: string }
      if (_el.__nvShow !== navStr) {
        ;(navEl as HTMLElement).style.setProperty('--nav-show', navStr)
        _el.__nvShow = navStr
      }
    })

    // Rail dots — each lights when t is near its index.
    this.railDots.forEach((dot, i) => {
      const d = Math.abs(this.state.t - i)
      const lit = clamp(1 - d * 2.2, 0, 1)
      const litStr = lit.toFixed(3)
      const _dot = dot as HTMLElement & { __nvLit?: string; __nvCurrent?: boolean; __nvPassed?: string }
      if (_dot.__nvLit !== litStr) {
        ;(dot as HTMLElement).style.setProperty('--lit', litStr)
        _dot.__nvLit = litStr
      }
      const isCurrent = dom === i
      if (_dot.__nvCurrent !== isCurrent) {
        dot.classList.toggle('current', isCurrent)
        _dot.__nvCurrent = isCurrent
      }
      const passed = this.state.t >= i ? 1 : Math.max(0, 1 - (i - this.state.t) * 1.0)
      const passedStr = passed.toFixed(3)
      if (_dot.__nvPassed !== passedStr) {
        ;(dot as HTMLElement).style.setProperty('--passed', passedStr)
        _dot.__nvPassed = passedStr
      }
    })

    this.opts.onProgress?.(this.state as ScrollState)

    this.state.lastTick = performance.now()
    this.rafId = requestAnimationFrame(this.tick)
  }
}
