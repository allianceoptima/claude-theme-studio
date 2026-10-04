// A Look is a palette resolved against a canvas: every background the mod
// paints and every foreground that sits on one, contrast-checked so a theme
// stays readable on dark and light alike. Pure, and memoized per input.

import type { Palette } from '../types'
import { ensureContrast, inkOn, mix } from './color'

export type Base = 'dark' | 'light'

export type Look = {
  base: Base
  /** The canvas everything is tinted from. */
  canvas: string
  promptBg: string
  replyBg: string
  codeBg: string
  /** Body text on a reply card. */
  text: string
  /** Body text on a prompt bubble. */
  promptText: string
  /** Headings, borders, chips: large or bold text, so 3:1 is the bar. */
  accent: string
  secondary: string
  highlight: string
  /** Text on an accent chip and on a secondary chip. */
  onAccent: string
  onSecondary: string
  /** Quiet labels: hints, the footer, the spinner's mode. */
  muted: string
  error: string
}

const CANVAS: Record<Base, string> = { dark: '#15151b', light: '#f7f6f2' }
const ERROR: Record<Base, string> = { dark: '#ff4d5e', light: '#c8102e' }

const cache = new Map<string, Look>()

export const lookOf = (pal: Palette, base: Base = 'dark', bgOverride: string | null = null): Look => {
  const key = `${pal.id}|${pal.accent}${pal.secondary}${pal.highlight}${pal.text}${pal.background ?? ''}|${base}|${bgOverride ?? ''}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = CANVAS[base]
  const custom = bgOverride ?? pal.background
  const strong = base === 'dark' ? 0.24 : 0.16
  const soft = base === 'dark' ? 0.1 : 0.07
  const replyBg = custom ?? mix(canvas, pal.secondary, soft)
  const promptBg = custom ? mix(custom, pal.accent, 0.12) : mix(canvas, pal.accent, strong)
  const codeBg = mix(replyBg, pal.highlight, base === 'dark' ? 0.2 : 0.14)

  const look: Look = {
    base,
    canvas,
    promptBg,
    replyBg,
    codeBg,
    text: ensureContrast(pal.text, replyBg, 4.5),
    promptText: ensureContrast(pal.text, promptBg, 4.5),
    accent: ensureContrast(pal.accent, replyBg, 3),
    secondary: ensureContrast(pal.secondary, replyBg, 3),
    highlight: ensureContrast(pal.highlight, replyBg, 3),
    onAccent: inkOn(pal.accent),
    onSecondary: inkOn(pal.secondary),
    muted: ensureContrast(mix(pal.secondary, canvas, 0.35), canvas, 3),
    error: ERROR[base],
  }
  if (cache.size > 64) cache.clear()
  cache.set(key, look)
  return look
}

/** A faint strip behind a tool row or command output, in `mark`. */
export const stripOf = (look: Look, mark: string, strength = 0.1): string => mix(look.canvas, mark, strength)
