export const KEY = 'tetun.progress.v1';

export function emptyProgress() {
  return { levels: {}, misses: {} };
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Read progress, dropping any field that is not valid. Never throws. */
export function loadProgress(storage) {
  let parsed;
  try {
    const raw = storage.getItem(KEY);
    if (raw === null || raw === undefined) return emptyProgress();
    parsed = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (!isPlainObject(parsed)) return emptyProgress();
  const out = emptyProgress();
  if (isPlainObject(parsed.levels)) {
    for (const [id, level] of Object.entries(parsed.levels)) {
      if (Number.isInteger(level) && level >= 0 && level <= 4) out.levels[id] = level;
    }
  }
  if (isPlainObject(parsed.misses)) {
    for (const [id, count] of Object.entries(parsed.misses)) {
      if (Number.isInteger(count) && count > 0) out.misses[id] = count;
    }
  }
  return out;
}

/** Write progress. Returns false if storage refuses (private mode, quota). */
export function saveProgress(storage, progress) {
  try {
    storage.setItem(KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function recordLevel(progress, lessonId, level) {
  const best = Math.max(progress.levels[lessonId] ?? 0, level);
  return { ...progress, levels: { ...progress.levels, [lessonId]: best } };
}

export function recordMiss(progress, entryId) {
  const count = (progress.misses[entryId] ?? 0) + 1;
  return { ...progress, misses: { ...progress.misses, [entryId]: count } };
}

export function recordHit(progress, entryId) {
  const count = (progress.misses[entryId] ?? 0) - 1;
  const misses = { ...progress.misses };
  if (count > 0) misses[entryId] = count;
  else delete misses[entryId];
  return { ...progress, misses };
}

/** Entries missed at least `threshold` times, most missed first, at most `limit`. */
export function keptMissing(progress, entries, threshold = 3, limit = 10) {
  return entries
    .map((entry, index) => ({ entry, index, count: progress.misses[entry.id] ?? 0 }))
    .filter((x) => x.count >= threshold)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.entry);
}
