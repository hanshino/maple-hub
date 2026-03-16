/**
 * Umami analytics helper
 * Wraps umami.track() with a safety check so it won't error
 * when Umami is not loaded (e.g. local development).
 */
export function track(eventName, data) {
  if (typeof window !== 'undefined' && typeof window.umami !== 'undefined') {
    window.umami.track(eventName, data);
  }
}
