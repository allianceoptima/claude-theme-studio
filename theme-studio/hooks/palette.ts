// Palette helpers: lookup, validation of stored data, the mixer's random
// neon. Pure functions over the preset table.

import type { Palette } from '../types'
import { hslToHex, isHex } from './color'
import { PRESETS } from './presets'

export const MINE = 'My themes'

/** Collections in table order, then the person's own. */
export const GROUPS: readonly string[] = [...new Set(PRESETS.map(one => one.group)), MINE]

export const DEFAULT_CUSTOM: Palette = {
  id: 'custom',
  name: 'Custom',
  group: MINE,
  accent: '#ff2bd6',
  secondary: '#00f0ff',
  highlight: '#fffb00',
  text: '#f5e9ff',
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** True for a well-formed palette, so a hand-edited or stale store can't break drawing. */
export const isPalette = (v: unknown): v is Palette => {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.group === 'string' &&
    isHex(o.accent) &&
    isHex(o.secondary) &&
    isHex(o.highlight) &&
    isHex(o.text) &&
    (o.background === undefined || isHex(o.background))
  )
}

/** Exact name first, then accent-insensitive prefix, then substring. */
export const findPreset = (query: string, mine: readonly Palette[] = []): Palette | undefined => {
  const q = slug(query)
  if (!q) return undefined
  const all = [...PRESETS, ...mine]
  return (
    all.find(one => slug(one.name) === q) ??
    all.find(one => slug(one.name).startsWith(q)) ??
    all.find(one => slug(one.name).includes(q))
  )
}

/** Every theme whose name or collection matches, best first, at most `limit`. */
export const searchPresets = (query: string, mine: readonly Palette[] = [], limit = 30): Palette[] => {
  const q = slug(query)
  if (!q) return []
  const all = [...PRESETS, ...mine]
  const score = (one: Palette) => {
    const n = slug(one.name)
    if (n === q) return 0
    if (n.startsWith(q)) return 1
    if (n.includes(q)) return 2
    return slug(one.group).includes(q) ? 3 : 9
  }
  return all
    .map(one => ({ one, s: score(one) }))
    .filter(x => x.s < 9)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map(x => x.one)
}

export const inGroup = (group: string, mine: readonly Palette[] = []): Palette[] =>
  group === MINE ? [...mine] : PRESETS.filter(one => one.group === group)

/** A random pick, optionally from one collection; `rand` is injectable for tests. */
export const pickRandom = (group?: string, rand: () => number = Math.random): Palette | undefined => {
  const pool = group ? PRESETS.filter(one => slug(one.group) === slug(group)) : PRESETS
  return pool[Math.floor(rand() * pool.length)]
}

type Scheme = { name: string; make: (h: number) => [string, string, string, string] }

const wrap = (h: number) => ((h % 360) + 360) % 360

// Each style places three hues around a base and picks saturation and
// lightness that read on a dark canvas; text stays light and low-saturation.
const SCHEMES: readonly Scheme[] = [
  { name: 'Neon', make: h => [hslToHex(h, 1, 0.58), hslToHex(wrap(h + 150), 1, 0.55), hslToHex(wrap(h + 60), 1, 0.6), hslToHex(h, 0.6, 0.94)] },
  { name: 'Pastel', make: h => [hslToHex(h, 0.75, 0.78), hslToHex(wrap(h + 120), 0.7, 0.8), hslToHex(wrap(h + 240), 0.7, 0.82), hslToHex(h, 0.4, 0.95)] },
  { name: 'Jewel', make: h => [hslToHex(h, 0.75, 0.55), hslToHex(wrap(h + 120), 0.7, 0.5), hslToHex(wrap(h + 240), 0.8, 0.6), hslToHex(h, 0.3, 0.92)] },
  { name: 'Earthy', make: h => [hslToHex(wrap(20 + (h % 50)), 0.55, 0.55), hslToHex(wrap(90 + (h % 50)), 0.35, 0.5), hslToHex(wrap(40 + (h % 20)), 0.7, 0.62), hslToHex(40, 0.3, 0.9)] },
  { name: 'Analogous', make: h => [hslToHex(h, 0.85, 0.6), hslToHex(wrap(h + 30), 0.8, 0.58), hslToHex(wrap(h - 30), 0.9, 0.65), hslToHex(h, 0.35, 0.93)] },
  { name: 'Mono', make: h => [hslToHex(h, 0.8, 0.62), hslToHex(h, 0.55, 0.48), hslToHex(h, 0.9, 0.78), hslToHex(h, 0.25, 0.94)] },
]

/** A palette in a random style (neon, pastel, jewel, earthy, analogous, mono) around a random hue. */
export const randomMix = (rand: () => number = Math.random): Palette => {
  const scheme = SCHEMES[Math.floor(rand() * SCHEMES.length)] ?? SCHEMES[0]!
  const [accent, secondary, highlight, text] = scheme.make(Math.floor(rand() * 360))
  return { ...DEFAULT_CUSTOM, name: `Random mix · ${scheme.name}`, accent, secondary, highlight, text }
}
