// The mixer's color picker: drawn in the studio pane, driven by the pointer.

import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { hexToHsv } from '../hooks/color'
import { PRESETS } from '../hooks/presets'

const SURFACES = ['terminal', 'desktop'] as const
const ENGINE = { timeoutMs: 20_000 }

type Mounted = Awaited<ReturnType<Engine['ui']['mount']>>

/** A slot's color as the studio shows it: the value in that slot's hex box. */
const hexOf = async (ui: Pick<Mounted, 'find'>, slot: string) => String((await ui.find({ type: 'Input', key: `hex-${slot}` }))?.props.value ?? '')

const studio = ($: Engine, surface: (typeof SURFACES)[number]) =>
  $.ui.mount({
    plugin: 'theme-studio',
    surface,
    component: 'Pane',
    requestId: 'theme-studio',
    props: {
      title: 'Theme Studio',
      isFocused: true,
      bodyColumns: 60,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 80 },
      view: {},
    },
  })

describe('color picker', () => {
  for (const surface of SURFACES) {
    test(`dragging in the field sets the accent on release on ${surface}`, ENGINE, async $ => {
      const ui = await studio($, surface)
      await ui.resize({ columns: 48, rows: 12, in: 'mixer' })
      const before = await hexOf(ui, 'accent')

      // At 48 columns the chips take rows 0-1, so the field spans rows 2-9.
      // Top-right of the field: full saturation, full brightness.
      await ui.pointer({ type: 'down', x: 47, y: 2, button: 'left', in: 'mixer' })
      await ui.pointer({ type: 'up', x: 47, y: 2, button: 'left', in: 'mixer' })

      const after = await hexOf(ui, 'accent')
      expect(after === '' || after === before).toBe(false)
      const hsv = hexToHsv(after)
      expect(hsv.s > 0.98 && hsv.v > 0.98).toBe(true)
    })

    test(`a chip picks which slot the picker edits on ${surface}`, ENGINE, async $ => {
      const ui = await studio($, surface)
      await ui.resize({ columns: 48, rows: 12, in: 'mixer' })
      const accentBefore = await hexOf(ui, 'accent')

      // Row 0 reads "██ Accent  ██ Secondary  ██ Highlight  ██ Text": Text's chip is columns 39-45.
      await ui.pointer({ type: 'down', x: 42, y: 0, button: 'left', in: 'mixer' })
      // Bottom-left of the field: no saturation, darkest row.
      await ui.pointer({ type: 'down', x: 0, y: 9, button: 'left', in: 'mixer' })
      await ui.pointer({ type: 'up', x: 0, y: 9, button: 'left', in: 'mixer' })

      expect(await hexOf(ui, 'accent')).toBe(accentBefore)
      expect(hexToHsv(await hexOf(ui, 'text')).s < 0.02).toBe(true)
    })

    test(`the background chip wraps to its own row and is pickable on ${surface}`, ENGINE, async $ => {
      const ui = await studio($, surface)
      await ui.resize({ columns: 48, rows: 12, in: 'mixer' })
      expect(await hexOf(ui, 'background')).toBe('')

      await ui.pointer({ type: 'down', x: 1, y: 1, button: 'left', in: 'mixer' })
      await ui.pointer({ type: 'down', x: 10, y: 9, button: 'left', in: 'mixer' })
      await ui.pointer({ type: 'up', x: 10, y: 9, button: 'left', in: 'mixer' })

      const bg = await hexOf(ui, 'background')
      expect(/^#[0-9a-f]{6}$/.test(bg)).toBe(true)
      expect(hexToHsv(bg).v < 0.2).toBe(true)
    })

    test(`🎲 applies one of every preset, not just neon, on ${surface}`, ENGINE, async $ => {
      const ui = await studio($, surface)
      const button = await ui.find({ type: 'Button', key: 'random-theme' })
      expect(button?.props.label).toBe(`🎲 Random theme (${PRESETS.length})`)
      await ui.press({ key: 'random-theme' })
      const applied = String((await ui.find({ type: 'Text', text: /^Applied / }))?.text ?? '').replace(/^Applied /, '')
      expect(PRESETS.some(one => one.name === applied)).toBe(true)
    })
  }
})
