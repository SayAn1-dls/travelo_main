// Travelo Analytics Stub — swap for PostHog/Mixpanel in production
// All events are no-ops during demo mode to prevent network calls

const isDev = process.env.NODE_ENV !== 'production';

export const analytics = {
  track(event, properties = {}) {
    if (isDev) {
      console.debug(`[TRAVELO ANALYTICS] ${event}`, properties);
      return;
    }
    // Production: window.posthog?.capture(event, properties);
  },

  page(name, properties = {}) {
    if (isDev) {
      console.debug(`[TRAVELO PAGE] ${name}`, properties);
      return;
    }
    // Production: window.posthog?.capture('$pageview', { page: name, ...properties });
  },

  identify(userId, traits = {}) {
    if (isDev) {
      console.debug(`[TRAVELO IDENTIFY] ${userId}`, traits);
      return;
    }
    // Production: window.posthog?.identify(userId, traits);
  },

  reset() {
    if (isDev) console.debug('[TRAVELO ANALYTICS] Session reset.');
    // Production: window.posthog?.reset();
  },
};

export default analytics;
