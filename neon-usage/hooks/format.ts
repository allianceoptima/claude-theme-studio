// Pure formatting for the usage band: what each meter says and how full it is.

import type { SessionContextUsage, SessionCost, SessionRateLimit } from 'claude-code'

import type { UsageSnap } from '../types'

export const toSnap = (context: SessionContextUsage, limits: readonly SessionRateLimit[], cost?: SessionCost): UsageSnap => ({
  ctxPercent: context.percent ?? null,
  ctxTokens: context.tokens ?? null,
  window: context.window,
  limits: limits.map(l => ({ kind: l.kind, percent: l.percentUsed, resetsAt: l.resetsAt })),
  usd: cost ? cost.usd : null,
})

const LABELS: Record<string, string> = { five_hour: '5H', seven_day: '7D', spend_limit: 'SPEND' }

export const labelOf = (kind: string) => LABELS[kind] ?? kind.replace(/_/g, ' ').toUpperCase()

/** `↻42m`, `↻2h05m`, `↻3d`; empty when unknown or past. */
export const untilReset = (iso: string | undefined, nowMs: number): string => {
  if (!iso || !nowMs) return ''
  const at = Date.parse(iso)
  if (Number.isNaN(at) || at <= nowMs) return ''
  const m = Math.round((at - nowMs) / 60_000)
  if (m < 60) return `↻${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `↻${h}h${String(m % 60).padStart(2, '0')}m`
  return `↻${Math.round(h / 24)}d`
}

/** Cells lit out of `width` for `percent`, clamped; anything above 0 lights at least one. */
export const litCells = (percent: number, width: number): number => {
  if (!(percent > 0)) return 0
  return Math.max(1, Math.min(width, Math.round((percent / 100) * width)))
}

export const money = (usd: number) => `$${usd < 10 ? usd.toFixed(2) : usd.toFixed(1)}`

export type Meter = { label: string; percent: number; extra: string }

export const metersOf = (s: UsageSnap, nowMs: number): Meter[] => [
  ...(s.ctxPercent !== null ? [{ label: 'CTX', percent: s.ctxPercent, extra: '' }] : []),
  ...s.limits.map(l => ({ label: labelOf(l.kind), percent: l.percent, extra: untilReset(l.resetsAt, nowMs) })),
]

const MOODS: readonly (readonly [number, string])[] = [
  [25, '✨'],
  [50, '😎'],
  [75, '🚀'],
  [90, '🌶️'],
]

/** A mood for the fullest meter: calm sparkle up to on fire. */
export const moodFor = (meters: readonly Meter[]): string => {
  const peak = meters.reduce((m, x) => Math.max(m, x.percent), 0)
  return MOODS.find(([cap]) => peak < cap)?.[1] ?? '🔥'
}

/** Green, then yellow, then hot pink as a meter fills. */
export const heatOf = (percent: number): string => (percent < 50 ? '#39ff14' : percent < 80 ? '#ffe600' : '#ff2079')
