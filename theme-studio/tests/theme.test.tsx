// Engine tests: the plugin loaded by the engine's own host, its hooks drawn on
// the surfaces a person uses.

import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const

// The first engine test pays for the host's cold start; on a busy machine that
// can pass the default 5 s, so engine tests get room.
const ENGINE = { timeoutMs: 20_000 }

/** `/theme <args>` as the person would type it at an 80-column terminal. */
const theme = ($: Engine, args: string) =>
  $.command.run({
    command: 'theme',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })

describe('/theme', () => {
  test('applies a theme by name and reports it', ENGINE, async $ => {
    const done = await theme($, 'dracula')
    expect(done.text).toContain('Dracula')
  })

  test('lists every collection', ENGINE, async $ => {
    const done = await theme($, 'list')
    expect(done.text).toContain('Hockey')
    expect(done.text).toContain('Dev Classics')
  })

  test('suggests close names for a typo', ENGINE, async $ => {
    const done = await theme($, 'drakula')
    expect(done.text).toContain('No theme matches')
  })

  test('rejects a bad background and accepts a hex', ENGINE, async $ => {
    expect((await theme($, 'bg nope')).text).toContain("isn't a hex color")
    expect((await theme($, 'bg #1a1a2e')).text).toContain('#1a1a2e')
    expect((await theme($, 'bg auto')).text).toContain('Background back')
  })
})

describe('drawing', () => {
  for (const surface of SURFACES) {
    test(`a prompt gets the YOU chip on ${surface}`, ENGINE, async $ => {
      await theme($, 'synthwave')
      const ui = await $.ui.mount({
        plugin: 'theme-studio',
        surface,
        component: 'UserMessage',
        props: { text: 'make it pop', origin: { kind: 'sdk' }, isExpanded: true },
      })
      expect(await ui.find({ type: 'Text', text: 'YOU' })).toBeTruthy()
    })

    test(`a reply is painted in theme colors on ${surface}`, ENGINE, async $ => {
      await theme($, 'nord')
      const ui = await $.ui.mount({
        plugin: 'theme-studio',
        surface,
        component: 'AssistantMessage',
        props: { text: '# Plan\n- one **bold** step\n- `code` here', isFirstOfReply: true },
      })
      expect(await ui.find({ type: 'Text', text: 'CLAUDE' })).toBeTruthy()
      expect(await ui.find({ type: 'Text', text: 'bold' })).toBeTruthy()
    })

    test(`with no theme the engine draws its own on ${surface}`, ENGINE, async ($, on) => {
      // Stand in for the engine's own drawing beneath the plugin.
      on('ui.render', { component: 'UserMessage' }, ($, e) => {
        const { Text } = $.ui.resolve(e)
        return <Text>engine row</Text>
      })
      await theme($, 'off')
      const ui = await $.ui.mount({
        plugin: 'theme-studio',
        surface,
        component: 'UserMessage',
        props: { text: 'plain', origin: { kind: 'sdk' }, isExpanded: true },
      })
      expect(await ui.find({ type: 'Text', text: 'YOU' })).toBe(undefined)
      expect(await ui.find({ type: 'Text', text: 'engine row' })).toBeTruthy()
    })
  }
})
