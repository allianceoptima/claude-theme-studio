# Changelog

All notable changes to both plugins. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-10-06

### Theme Studio

- **A color picker in Mix your own.** Click a slot's chip (Accent, Secondary,
  Highlight, Text or Background), then click or drag in the saturation and
  brightness field or the hue strip. The mixer updates live while you drag; the
  color is saved, and the chat recolors if the custom theme is on, when you let go.
  Works in the terminal and the desktop app; the hex boxes stay for exact values.
- **🎲 Random theme** now picks from all 441 presets.
- **🎨 Random mix** replaces Random neon: it rolls a palette in one of six styles
  (neon, pastel, jewel, earthy, analogous, mono) instead of always neon.

## [1.1.0] — 2026-10-04

### Theme Studio

- The 🎨 theme chip in the footer is now a button: click it to open the studio,
  docked beside the transcript where the surface docks panes. Escape closes it.

## [1.0.0] — 2026-10-04

First public release.

### Theme Studio

- 441 palettes in 63 collections, each contrast-checked on dark and light canvases.
- Recolors prompts, replies (headings, lists, quotes, bold, italic, inline code,
  strikethrough), tool rows, folded tool runs, tool results, the spinner, the
  footer, the end-of-turn line, slash-command output and every mod pane.
- `/theme <name | random | next | prev | list | bg | base | off | help>`.
- The studio pane: search across every theme, browse by collection, mix and save
  your own, and options for message style, chrome, canvas and background.
- A background override for every theme (`/theme bg`), with text re-checked for
  contrast against it.
- Follows Claude Code's dark/light theme setting and `prefersReducedMotion`.
- Theme, saved mixes and options persist across sessions; stored data is
  validated on load.

### Neon Usage

- One-line band above the prompt: context fill, five-hour and seven-day windows
  with reset countdowns, session cost and a mood emoji.
- Follows Theme Studio's colors and canvas when it is installed.
- `/neon-usage [on | off]`.
