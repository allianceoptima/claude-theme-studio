import { describe, expect, test } from 'claude-code/testing'

import { labelOf, litCells, metersOf, money, moodFor, untilReset } from '../hooks/format'

describe('untilReset', () => {
  const t0 = Date.parse('2026-10-04T00:00:00Z')
  test('formats minutes, hours and days', () => {
    expect(untilReset('2026-10-04T00:42:00Z', t0)).toBe('↻42m')
    expect(untilReset('2026-10-04T02:05:00Z', t0)).toBe('↻2h05m')
    expect(untilReset('2026-10-07T00:00:00Z', t0)).toBe('↻3d')
  })
  test('is empty when unknown or already past', () => {
    expect(untilReset(undefined, t0)).toBe('')
    expect(untilReset('not a date', t0)).toBe('')
    expect(untilReset('2026-10-03T00:00:00Z', t0)).toBe('')
  })
})

describe('meters', () => {
  test('litCells clamps and never hides a non-zero meter', () => {
    expect(litCells(0, 6)).toBe(0)
    expect(litCells(1, 6)).toBe(1)
    expect(litCells(50, 6)).toBe(3)
    expect(litCells(140, 6)).toBe(6)
  })
  test('labels known windows and spells unknown ones', () => {
    expect(labelOf('five_hour')).toBe('5H')
    expect(labelOf('weekly_opus')).toBe('WEEKLY OPUS')
  })
  test('builds the context meter first, then the limits', () => {
    const m = metersOf({ ctxPercent: 48, ctxTokens: 96_000, window: 200_000, limits: [{ kind: 'seven_day', percent: 9 }], usd: 1.23 }, 0)
    expect(m.map(x => x.label)).toEqual(['CTX', '7D'])
    expect(moodFor(m)).toBe('😎')
    expect(money(1.234)).toBe('$1.23')
    expect(money(12.34)).toBe('$12.3')
  })
})
