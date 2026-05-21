export interface NvChapterDetail {
  index: number
  key: string
  prev: number
}

export type NvChapterEvent = CustomEvent<NvChapterDetail>

declare global {
  interface WindowEventMap {
    'nv:chapter': NvChapterEvent
  }
}

export function dispatchChapterChange(detail: NvChapterDetail): void {
  window.dispatchEvent(new CustomEvent('nv:chapter', { detail }))
}
