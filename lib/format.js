/**
 * Formats a date value for zh-TW locale display — extracted from
 * components/CharacterCard.js so components/compare/DataQualityNotice.js
 * doesn't need its own copy.
 *
 * The two existing callers differ on what a missing/unparsable `value`
 * should render as, so that's kept configurable rather than baked in:
 *   - CharacterCard.js (hour12: true, its original default) falls back
 *     to the current date/time, matching its historical behavior.
 *   - DataQualityNotice.js (hour12: false) passes `fallbackToNow: false`
 *     to get `null` back instead, so it can supply its own "未標註日期"
 *     wording — matching its original formatSyncedAt behavior.
 */
export function formatTimestamp(
  value,
  { hour12 = true, fallbackToNow = true } = {}
) {
  if (!value && !fallbackToNow) return null;
  try {
    const date = value ? new Date(value) : new Date();
    if (!fallbackToNow && Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12,
    });
  } catch {
    return fallbackToNow ? '-' : null;
  }
}
