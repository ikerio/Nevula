/** Shared contract for chapter-3 console surfaces (Marketplace / Station / Console). */
export interface SurfaceController {
  /** Run the surface's scripted signature beat from a clean state. */
  play(): void
  /** Cancel any in-flight beat and restore the initial static state. */
  reset(): void
  /** Tear down timers/listeners. */
  dispose(): void
}
