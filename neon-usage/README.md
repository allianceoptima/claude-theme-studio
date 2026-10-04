# Neon Usage

A one-line band above Claude Code's prompt:

```
⚡ CTX ▰▰▰▱▱▱ 48%  5H ▰▱▱▱▱▱ 23% ↻2h14m  7D ▰▱▱▱▱▱ 9%  $1.23 😎 ×
```

- **CTX**: how full the context window is.
- **5H / 7D**: your rate-limit windows, with a countdown to each reset (subscription plans).
- **$**: what the session has cost so far.
- The mood emoji heats up from ✨ to 🔥 as the fullest meter rises; the bolt
  shimmers while Claude works.

Follows [Theme Studio](../theme-studio)'s colors and canvas when that plugin is
installed. `/neon-usage [on | off]` shows or hides it; `×` hides it too.

```
/plugin install neon-usage@claude-theme-studio
```
