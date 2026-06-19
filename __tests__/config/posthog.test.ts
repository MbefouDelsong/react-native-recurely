/**
 * Tests for src/config/posthog.ts
 *
 * Covers:
 * - Environment variable reading (EXPO_PUBLIC_POSTHOG_API_KEY, EXPO_PUBLIC_POSTHOG_HOST)
 * - isPostHogConfigured logic (blank, placeholder token, real token)
 * - PostHog constructor arguments (apiKey, host fallback, disabled flag, options)
 * - console.warn when unconfigured
 * - posthog.debug() called with __DEV__ value
 * - Whitespace trimming of env vars
 */

// Shared mock function for posthog.debug() — persists across module resets.
const mockDebug = jest.fn()

/**
 * Loads (or re-loads) the posthog module in an isolated module registry.
 *
 * Returns:
 *  - `mod`:       the exports of src/config/posthog
 *  - `PostHog`:   the mocked PostHog constructor used by that module load
 */
function loadModule(): {
  mod: { posthog: unknown }
  PostHog: jest.Mock
} {
  let PostHog!: jest.Mock
  let mod!: { posthog: unknown }

  jest.isolateModules(() => {
    // Register a fresh factory so posthog.ts gets a clean constructor each run.
    jest.mock('posthog-react-native', () => {
      PostHog = jest.fn().mockImplementation((apiKey: string, options: Record<string, unknown>) => ({
        debug: mockDebug,
        _apiKey: apiKey,
        _options: options,
      }))
      return { __esModule: true, default: PostHog }
    })
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../../src/config/posthog') as { posthog: unknown }
  })

  return { mod, PostHog }
}

describe('src/config/posthog', () => {
  const originalEnv = process.env
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    // Give each test an isolated copy of process.env
    process.env = { ...originalEnv }
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY
    delete process.env.EXPO_PUBLIC_POSTHOG_HOST

    mockDebug.mockClear()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    warnSpy.mockRestore()
  })

  // ─── isPostHogConfigured: falsy paths ────────────────────────────────────

  describe('when EXPO_PUBLIC_POSTHOG_API_KEY is not set', () => {
    it('emits a console.warn with the correct env var name', () => {
      loadModule()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Set EXPO_PUBLIC_POSTHOG_API_KEY in your .env file to enable analytics.')
      )
    })

    it('emits a console.warn mentioning analytics will be disabled', () => {
      loadModule()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analytics will be disabled.')
      )
    })

    it('creates PostHog with disabled: true', () => {
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(true)
    })

    it('falls back to "placeholder_key" as the API key argument', () => {
      const { PostHog } = loadModule()
      expect(PostHog.mock.calls[0]![0]).toBe('placeholder_key')
    })
  })

  describe('when EXPO_PUBLIC_POSTHOG_API_KEY is an empty string', () => {
    it('treats the key as unconfigured and warns', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = ''
      loadModule()
      expect(warnSpy).toHaveBeenCalled()
    })

    it('disables PostHog', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = ''
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(true)
    })
  })

  describe('when EXPO_PUBLIC_POSTHOG_API_KEY is the placeholder token', () => {
    it('treats "phc_your_project_token_here" as unconfigured and warns', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_your_project_token_here'
      loadModule()
      expect(warnSpy).toHaveBeenCalled()
    })

    it('disables PostHog for the placeholder token', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_your_project_token_here'
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(true)
    })
  })

  // ─── isPostHogConfigured: truthy paths ───────────────────────────────────

  describe('when EXPO_PUBLIC_POSTHOG_API_KEY is a valid real token', () => {
    const validKey = 'phc_y7FWst843eQ3x3zZZm2XboHvyKhcpNZpeGF85R2Bt5BR'

    it('does NOT emit console.warn', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      loadModule()
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('passes the real API key to PostHog', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      const { PostHog } = loadModule()
      expect(PostHog.mock.calls[0]![0]).toBe(validKey)
    })

    it('creates PostHog with disabled: false', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(false)
    })

    it('exports a posthog instance', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      const { mod } = loadModule()
      expect(mod).toHaveProperty('posthog')
    })
  })

  // ─── Whitespace trimming ─────────────────────────────────────────────────

  describe('whitespace trimming', () => {
    it('trims leading/trailing whitespace from EXPO_PUBLIC_POSTHOG_API_KEY', () => {
      const validKey = 'phc_realtoken'
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = `  ${validKey}  `
      const { PostHog } = loadModule()
      expect(PostHog.mock.calls[0]![0]).toBe(validKey)
    })

    it('trims leading/trailing whitespace from EXPO_PUBLIC_POSTHOG_HOST', () => {
      const host = 'https://eu.i.posthog.com'
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_realtoken'
      process.env.EXPO_PUBLIC_POSTHOG_HOST = `  ${host}  `
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).host).toBe(host)
    })

    it('treats a whitespace-only API key as unconfigured (disables PostHog)', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = '   '
      const { PostHog } = loadModule()
      // trimmed to '' → falsy → disabled
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(true)
    })
  })

  // ─── Host configuration ──────────────────────────────────────────────────

  describe('host configuration', () => {
    const validKey = 'phc_realtoken'

    it('defaults to "https://us.i.posthog.com" when EXPO_PUBLIC_POSTHOG_HOST is not set', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).host).toBe('https://us.i.posthog.com')
    })

    it('uses the custom host when EXPO_PUBLIC_POSTHOG_HOST is set', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com'
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).host).toBe('https://eu.i.posthog.com')
    })

    it('falls back to default host when EXPO_PUBLIC_POSTHOG_HOST is an empty string', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      process.env.EXPO_PUBLIC_POSTHOG_HOST = ''
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).host).toBe('https://us.i.posthog.com')
    })
  })

  // ─── PostHog constructor options ─────────────────────────────────────────

  describe('PostHog constructor options', () => {
    const validKey = 'phc_realtoken'

    function loadAndGetOptions(): Record<string, unknown> {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = validKey
      const { PostHog } = loadModule()
      return PostHog.mock.calls[0]![1] as Record<string, unknown>
    }

    it('sets captureAppLifecycleEvents: true', () => {
      expect(loadAndGetOptions().captureAppLifecycleEvents).toBe(true)
    })

    it('sets flushAt: 20', () => {
      expect(loadAndGetOptions().flushAt).toBe(20)
    })

    it('sets flushInterval: 10000', () => {
      expect(loadAndGetOptions().flushInterval).toBe(10000)
    })

    it('sets maxBatchSize: 100', () => {
      expect(loadAndGetOptions().maxBatchSize).toBe(100)
    })

    it('sets maxQueueSize: 1000', () => {
      expect(loadAndGetOptions().maxQueueSize).toBe(1000)
    })

    it('sets preloadFeatureFlags: true', () => {
      expect(loadAndGetOptions().preloadFeatureFlags).toBe(true)
    })

    it('sets sendFeatureFlagEvent: true', () => {
      expect(loadAndGetOptions().sendFeatureFlagEvent).toBe(true)
    })

    it('sets featureFlagsRequestTimeoutMs: 10000', () => {
      expect(loadAndGetOptions().featureFlagsRequestTimeoutMs).toBe(10000)
    })

    it('sets requestTimeout: 10000', () => {
      expect(loadAndGetOptions().requestTimeout).toBe(10000)
    })

    it('sets fetchRetryCount: 3', () => {
      expect(loadAndGetOptions().fetchRetryCount).toBe(3)
    })

    it('sets fetchRetryDelay: 3000', () => {
      expect(loadAndGetOptions().fetchRetryDelay).toBe(3000)
    })
  })

  // ─── debug() call ────────────────────────────────────────────────────────

  describe('posthog.debug()', () => {
    it('calls posthog.debug with the global __DEV__ value (true in test env)', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_realtoken'
      loadModule()
      expect(mockDebug).toHaveBeenCalledTimes(1)
      expect(mockDebug).toHaveBeenCalledWith(true)
    })

    it('calls posthog.debug even when PostHog is disabled (no API key)', () => {
      loadModule()
      expect(mockDebug).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Module exports ──────────────────────────────────────────────────────

  describe('module exports', () => {
    it('exports a named posthog constant', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_realtoken'
      const { mod } = loadModule()
      expect(mod).toHaveProperty('posthog')
    })

    it('PostHog constructor is called exactly once per module load', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_realtoken'
      const { PostHog } = loadModule()
      expect(PostHog).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Regression: env var is the literal string "undefined" ──────────────

  describe('regression: env var set to the string "undefined"', () => {
    it('treats "undefined" as a valid (non-placeholder) key', () => {
      // "undefined" !== '' and !== 'phc_your_project_token_here' so isPostHogConfigured is true.
      // This test documents the current behavior so regressions are caught.
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'undefined'
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(false)
      expect(PostHog.mock.calls[0]![0]).toBe('undefined')
    })
  })

  // ─── Boundary: minimal valid phc_ token ─────────────────────────────────

  describe('boundary: minimal valid token (not the placeholder)', () => {
    it('enables PostHog for a short token starting with "phc_"', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_abc123'
      const { PostHog } = loadModule()
      expect((PostHog.mock.calls[0]![1] as Record<string, unknown>).disabled).toBe(false)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  // ─── Negative: warn message must NOT appear when configured ──────────────

  describe('negative: correct warning suppression', () => {
    it('does not warn when a valid key and host are both set', () => {
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_validtoken'
      process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com'
      loadModule()
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})