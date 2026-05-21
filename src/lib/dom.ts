/**
 * Parse an HTML string into a single root element.
 * The string must produce exactly one root node (children of <template>).
 */
export function htmlEl<T extends HTMLElement = HTMLElement>(html: string): T {
  const tpl = document.createElement('template')
  tpl.innerHTML = html.trim()
  const el = tpl.content.firstElementChild
  if (!el) throw new Error('htmlEl: empty template')
  return el as T
}
