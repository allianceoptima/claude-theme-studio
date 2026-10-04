// Neon Usage: a one-line band above the prompt with the context window's fill,
// the rate-limit windows and the session's cost. Follows Theme Studio's colors
// when that plugin is on; neon otherwise. `/neon-usage` shows or hides it.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { ensureContrast, mix } from './color'
import { heatOf, litCells, metersOf, money, moodFor, toSnap } from './format'

const snap = atom({ plugin: 'neon-usage', key: 'snap' } as const, null)
const isHidden = atom({ plugin: 'neon-usage', key: 'isHidden' } as const, false)
const isWorking = atom({ plugin: 'neon-usage', key: 'isWorking' } as const, false)
const frame = atom({ plugin: 'neon-usage', key: 'frame' } as const, 0)
const now = atom({ plugin: 'neon-usage', key: 'now' } as const, 0)
const reducedMotion = atom({ plugin: 'neon-usage', key: 'reducedMotion' } as const, false)

// Theme Studio's pick and canvas, when that plugin is on (any plugin reads any value).
const themeRef = { plugin: 'theme-studio', key: 'active' } as const
const baseRef = { plugin: 'theme-studio', key: 'resolvedBase' } as const

type Colors = { a: string; b: string; c: string }
const NEON: Colors = { a: '#00f0ff', b: '#ff2bd6', c: '#fffb00' }
const RAINBOW = ['#ff2bd6', '#b026ff', '#00f0ff', '#39ff14', '#fffb00', '#ff8a00']
const CANVAS = { dark: '#15151b', light: '#f7f6f2' } as const
const SHIMMER_MS = 450
const CLOCK_MS = 60_000

async function refresh($: EngineInterface) {
  try {
    const u = await $.session.usage()
    await update($, snap, () => toSnap(u.context, u.rateLimits, u.cost))
  } catch {
    // No figures yet (a fresh session): the band says so until the first measure.
  }
  const t = await $.clock.now()
  await update($, now, () => t)
}

async function setHidden($: EngineInterface, hidden: boolean) {
  await update($, isHidden, () => hidden)
  try {
    await $.store.set('isHidden', hidden)
  } catch {
    // The session value stands.
  }
}

export const register: Register = on => {
  let tick: Timer | null = null
  const stopShimmer = () => {
    tick?.cancel()
    tick = null
  }

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'neon-usage',
      description: 'Show or hide the neon usage band above the prompt',
      argumentHint: '[on | off]',
    })
    try {
      const hidden = await $.store.get('isHidden')
      if (typeof hidden === 'boolean') await update($, isHidden, () => hidden)
      const settings = await $.settings.read()
      await update($, reducedMotion, () => settings.prefersReducedMotion === true)
    } catch {
      // Defaults stand.
    }
    await refresh($)
    // Keep the reset countdowns honest between turns.
    $.clock.every(CLOCK_MS, () => void $.clock.now().then(t => update($, now, () => t)))
    return next(e)
  })

  on('command.run', { command: 'neon-usage' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const hidden = arg === 'on' ? false : arg === 'off' ? true : !(await read($, isHidden))
    await setHidden($, hidden)
    return { text: hidden ? 'Neon usage band hidden. `/neon-usage` brings it back.' : 'Neon usage band is back ⚡' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, snap, () => toSnap(e.context, e.rateLimits, e.cost))
    const t = await $.clock.now()
    await update($, now, () => t)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, isWorking, () => true)
    stopShimmer()
    if (!(await read($, reducedMotion))) {
      tick = $.clock.every(SHIMMER_MS, () => void update($, frame, f => (f + 1) % 600))
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    stopShimmer()
    await update($, isWorking, () => false)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)
    const s = await read($, snap)
    const working = (await read($, isWorking)) || e.props.isWorking
    const f = working && !(await read($, reducedMotion)) ? await read($, frame) : 0
    const nowMs = await read($, now)
    const theme = (await $.state.get(themeRef)).value
    const canvas = (await $.state.get(baseRef)).value === 'light' ? CANVAS.light : CANVAS.dark

    // Every color is checked against the canvas, so a pale theme stays legible on light.
    const legible = (hex: string) => ensureContrast(hex, canvas, 3)
    const k: Colors = theme
      ? { a: legible(theme.accent), b: legible(theme.secondary), c: legible(theme.highlight) }
      : { a: legible(NEON.a), b: legible(NEON.b), c: legible(NEON.c) }
    const shimmer = theme ? [k.a, k.b, k.c, k.b] : RAINBOW.map(legible)
    const width = e.props.bodyColumns < 70 ? 4 : 6
    const stop = (t: number) => (t < 0.5 ? mix(k.a, k.b, t * 2) : mix(k.b, k.c, (t - 0.5) * 2))

    const bolt = (
      <Text bold color={working ? (shimmer[f % shimmer.length] ?? k.c) : k.c}>
        {'⚡'}
      </Text>
    )

    if (!s) {
      return (
        <Box gap={1}>
          {bolt}
          <Text dimColor>meters light up after your first prompt</Text>
        </Box>
      )
    }

    const meters = metersOf(s, nowMs)
    return (
      <Box gap={2} flexWrap="wrap">
        {bolt}
        {meters.map(m => {
          const lit = litCells(m.percent, width)
          return (
            <Box key={`meter-${m.label}`} gap={1}>
              <Text bold color={k.a}>
                {m.label}
              </Text>
              <Text>
                {Array.from({ length: width }, (_, i) =>
                  i < lit ? <Text color={stop(i / (width - 1))}>▰</Text> : <Text dimColor>▱</Text>,
                )}
              </Text>
              <Text bold color={legible(heatOf(m.percent))}>{`${Math.round(m.percent)}%`}</Text>
              {m.extra ? <Text dimColor>{m.extra}</Text> : null}
            </Box>
          )
        })}
        {s.usd !== null ? (
          <Text bold color={k.c}>
            {money(s.usd)}
          </Text>
        ) : null}
        {meters.length > 0 ? <Text>{moodFor(meters)}</Text> : null}
        <Button
          key="hide"
          label="×"
          plain
          dimColor
          onPress={async () => {
            await setHidden($, true)
            $.ui.toast('Neon band hidden: /neon-usage brings it back ⚡')
          }}
        />
      </Box>
    )
  })
}
