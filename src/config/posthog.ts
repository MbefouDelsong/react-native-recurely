import PostHog from 'posthog-react-native'

const rawApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
const rawHost = process.env.EXPO_PUBLIC_POSTHOG_HOST

const apiKey = rawApiKey?.trim()
const host = rawHost?.trim()

// Check configurations using your real project token prefix
const isPostHogConfigured = !!apiKey && apiKey !== '' && apiKey !== 'phc_your_project_token_here'

if (!isPostHogConfigured) {
  console.warn(
    'PostHog project token not configured. Analytics will be disabled. ' +
    'Set EXPO_PUBLIC_POSTHOG_API_KEY in your .env file to enable analytics.'
  )
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host: host || 'https://us.i.posthog.com',
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true, 
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  sendFeatureFlagEvent: true,
  featureFlagsRequestTimeoutMs: 10000,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
})

posthog.debug(__DEV__)