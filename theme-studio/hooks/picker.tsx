// The mixer's color picker: a surface module drawn in a `Client` region.
//
//   chip rows    the five slots as chips, wrapping as the width needs; click one
//   8 rows       saturation (left → right) by brightness (top → bottom)
//   1 row        the hue strip
//   1 row        the picked color's hex
//
// Click or drag in the field or the strip. Every move posts the color to the
// hooks module (`{ slot, hex, final: false }`); letting go posts it once more
// with `final: true`, which is when the hooks module saves it.
//
// Self-contained on purpose: a surface module runs on the drawing thread, so
// it carries its own few lines of color math rather than importing.

import type { ClientModule, ClientPointerEvent } from 'claude-code'

export type Slot = 'accent' | 'secondary' | 'highlight' | 'text' | 'background'

export type PickerProps = {
  colors: Record<Slot, string | null>
  /** What the background slot shows while it is unset (tinted from the accent). */
  autoBackground: string
}

type PickerState = { slot: Slot; h: number; s: number; v: number; hex: string; dragging: 'field' | 'hue' | null }

const SLOTS: readonly { slot: Slot; label: string }[] = [
  { slot: 'accent', label: 'Accent' },
  { slot: 'secondary', label: 'Secondary' },
  { slot: 'highlight', label: 'Highlight' },
  { slot: 'text', label: 'Text' },
  { slot: 'background', label: 'Background' },
]

const FIELD_ROWS = 8
const MIN_VALUE = 0.12
const CHIP_GAP = 2

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const hsvToHex = (h: number, s: number, v: number): string => {
  const k = (n: number) => (n + h / 60) % 6
  const f = (n: number) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1))
  return `#${[f(5), f(3), f(1)].map(c => Math.round(clamp(c, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`
}

const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  const n = parseInt(hex.slice(1, 7), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  const h =
    d === 0 ? 0 : max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4)
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max }
}

const ink = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16)
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return lum > 150 ? '#111111' : '#ffffff'
}

type ChipSpan = { slot: Slot; label: string; row: number; start: number; end: number }

/** Where each chip sits: its row and [start, end) columns, wrapping to fit `width`. */
const layoutChips = (width: number): ChipSpan[] => {
  let row = 0
  let x = 0
  return SLOTS.map(({ slot, label }) => {
    const size = 2 + 1 + label.length // "██" + space + label
    if (x > 0 && x + size > width) {
      row += 1
      x = 0
    }
    const span = { slot, label, row, start: x, end: x + size }
    x += size + CHIP_GAP
    return span
  })
}

const Picker: ClientModule<PickerProps, PickerState> = (props, surface) => {
  const { Box, Text } = surface.elements
  const width = clamp(surface.columns || 40, 12, 48)
  const chips = layoutChips(width)
  const top = (chips[chips.length - 1]?.row ?? 0) + 1 // the field's first row
  const hueRow = top + FIELD_ROWS
  const colorOf = (slot: Slot) => props.colors[slot] ?? (slot === 'background' ? props.autoBackground : '#888888')

  // What to draw: the interaction's own HSV while it matches the slot's color
  // (so hue survives a drag through grey), else the slot's color as it is now.
  const st = surface.state
  const slot: Slot = st?.slot ?? 'accent'
  const current = colorOf(slot)
  const hsv = st && st.slot === slot && (st.hex === current || st.dragging) ? st : { ...hexToHsv(current), hex: current }

  const pick = (x: number, y: number, final: boolean, drag: 'field' | 'hue') => {
    const fx = clamp(x, 0, width - 1) / (width - 1)
    const next =
      drag === 'hue'
        ? { h: fx * 359, s: hsv.s, v: hsv.v }
        : { h: hsv.h, s: fx, v: 1 - (clamp(y - top, 0, FIELD_ROWS - 1) / (FIELD_ROWS - 1)) * (1 - MIN_VALUE) }
    const hex = hsvToHex(next.h, next.s, next.v)
    surface.setState({ slot, ...next, hex, dragging: final ? null : drag })
    surface.post({ slot, hex, final })
  }

  surface.onPointer((e: ClientPointerEvent) => {
    if (e.type === 'down' && e.button === 'left') {
      if (e.y < top) {
        const chip = chips.find(c => c.row === e.y && e.x >= c.start && e.x < c.end)
        if (chip && chip.slot !== slot) surface.setState({ slot: chip.slot, ...hexToHsv(colorOf(chip.slot)), hex: colorOf(chip.slot), dragging: null })
        return
      }
      if (e.y >= top && e.y < hueRow) pick(e.x, e.y, false, 'field')
      else if (e.y === hueRow) pick(e.x, e.y, false, 'hue')
      return
    }
    if (e.type === 'move' && e.button === 'left' && st?.dragging) pick(e.x, e.y, false, st.dragging)
    if (e.type === 'up' && st?.dragging) pick(e.x, e.y, true, st.dragging)
  })

  const markX = Math.round(hsv.s * (width - 1))
  const markY = Math.round(((1 - hsv.v) / (1 - MIN_VALUE)) * (FIELD_ROWS - 1))
  const hueX = Math.round((hsv.h / 359) * (width - 1))
  const cells = Array.from({ length: width }, (_, x) => x)

  return (
    <Box flexDirection="column">
      {Array.from({ length: top }, (_, row) => (
        <Text>
          {chips
            .filter(c => c.row === row)
            .map(c => (
              <Text>
                {c.start > 0 ? ' '.repeat(CHIP_GAP) : ''}
                <Text color={colorOf(c.slot)}>{'██'}</Text>
                <Text bold={c.slot === slot} underline={c.slot === slot} dimColor={c.slot !== slot}>
                  {` ${c.label}`}
                </Text>
              </Text>
            ))}
        </Text>
      ))}
      {Array.from({ length: FIELD_ROWS }, (_, y) => {
        const v = 1 - (y / (FIELD_ROWS - 1)) * (1 - MIN_VALUE)
        return (
          <Text>
            {cells.map(x => {
              const bg = hsvToHex(hsv.h, x / (width - 1), v)
              return x === markX && y === markY ? (
                <Text backgroundColor={bg} color={ink(bg)}>
                  {'◆'}
                </Text>
              ) : (
                <Text backgroundColor={bg}>{' '}</Text>
              )
            })}
          </Text>
        )
      })}
      <Text>
        {cells.map(x => {
          const bg = hsvToHex((x / (width - 1)) * 359, 1, 1)
          return x === hueX ? (
            <Text backgroundColor={bg} color={ink(bg)}>
              {'▲'}
            </Text>
          ) : (
            <Text backgroundColor={bg}>{' '}</Text>
          )
        })}
      </Text>
      <Text>
        <Text backgroundColor={hsv.hex} color={ink(hsv.hex)}>{` ${hsv.hex} `}</Text>
        <Text dimColor>{`  ${SLOTS.find(c => c.slot === slot)?.label ?? ''} · click or drag`}</Text>
      </Text>
    </Box>
  )
}

export default Picker
