/** Lowercase, strip diacritics, trim and collapse whitespace. */
export function normalise(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function rank(fields, q) {
  if (fields.some((f) => f === q)) return 0;
  if (fields.some((f) => f.startsWith(q) || f.includes(' ' + q))) return 1;
  return 2;
}

/**
 * Entries whose Tetun or English contains every word of the query,
 * ranked exact, then word-start, then substring (original order within a group).
 */
export function search(entries, query) {
  const q = normalise(query);
  if (!/[\p{L}\p{N}]/u.test(q)) return [];
  const tokens = q.split(' ');
  const hits = [];
  entries.forEach((entry, index) => {
    const fields = [normalise(entry.tetun), normalise(entry.english)];
    const haystack = fields.join(' ');
    if (tokens.every((t) => haystack.includes(t))) {
      hits.push({ entry, index, rank: rank(fields, q) });
    }
  });
  hits.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return hits.map((h) => h.entry);
}
