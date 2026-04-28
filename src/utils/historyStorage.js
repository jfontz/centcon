const STORAGE_KEY = "centcon:history";
const RETENTION_DAYS = 60;

export const HISTORY_TYPES = {
  LOS: "los",
  INTERNET: "internet",
  UNREACHABLE: "unreachable",
  REBOOT: "reboot",
  WARNING: "warning",
};

// Severity order for bucket coloring (higher = worse)
export const SEVERITY = {
  reboot: 1,
  warning: 2,
  internet: 3,
  unreachable: 3,
  los: 4,
};

export const readHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const pruneOld = (events) => {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return events.filter((e) => e.ts >= cutoff);
};

/**
 * Check if an event is a duplicate in the recent history.
 * Looks at the last 10 events to catch duplicates even when different
 * event types are mixed together (e.g., Fiber restored, Internet restored, Fiber restored).
 * Duplicates are defined as: same type + text, with timestamp within 500ms.
 */
const isDuplicateEvent = (events, newEvent, now) => {
  if (!events || events.length === 0) return false;

  // Check last 10 events for duplicates
  const recentEvents = events.slice(-10);
  return recentEvents.some(
    (e) =>
      e.type === newEvent.type && e.text === newEvent.text && now - e.ts < 500,
  );
};

export const appendHistory = (event) => {
  try {
    const events = pruneOld(readHistory());
    const now = Date.now();

    // Skip if this is a duplicate found in recent history
    if (isDuplicateEvent(events, event, now)) {
      return;
    }

    events.push({ ...event, id: crypto.randomUUID(), ts: now });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Storage full — prune aggressively and retry
    try {
      const half = readHistory().slice(-200);
      const now = Date.now();

      // Skip if this is a duplicate found in recent history (in fallback scenario)
      if (isDuplicateEvent(half, event, now)) {
        return;
      }

      half.push({ ...event, id: crypto.randomUUID(), ts: now });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {}
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Buckets events into N slots covering the given time range.
 * Returns array of { start, end, events[], worstSeverity }
 */
export const bucketEvents = (events, rangeMs, bucketCount) => {
  const now = Date.now();
  const start = now - rangeMs;
  const bucketMs = rangeMs / bucketCount;

  return Array.from({ length: bucketCount }, (_, i) => {
    const bStart = start + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const bEvents = events.filter((e) => e.ts >= bStart && e.ts < bEnd);
    const worstSeverity = bEvents.reduce(
      (max, e) => Math.max(max, SEVERITY[e.type] ?? 0),
      0,
    );
    return { start: bStart, end: bEnd, events: bEvents, worstSeverity };
  });
};
