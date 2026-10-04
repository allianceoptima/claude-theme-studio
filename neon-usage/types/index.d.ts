/** One rate-limit window as the band draws it. */
export type Limit = { kind: string; percent: number; resetsAt?: string }

/** The figures the band draws, from `session.measure` or `$.session.usage()`. */
export type UsageSnap = {
  ctxPercent: number | null
  ctxTokens: number | null
  window: number
  limits: Limit[]
  usd: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'neon-usage': {
      snap: UsageSnap | null
      isHidden: boolean
      /** True between a prompt and the end of its turn: the bolt shimmers. */
      isWorking: boolean
      frame: number
      /** The clock, refreshed each minute, for the reset countdowns. */
      now: number
      /** Claude Code's `prefersReducedMotion`: no shimmer when true. */
      reducedMotion: boolean
    }
  }
}
