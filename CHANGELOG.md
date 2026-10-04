# Changelog

All notable changes to both plugins. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

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
