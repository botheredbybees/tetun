/** Load the word data. Throws if the file cannot be fetched. */
export async function loadWords(url = 'content/words.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return response.json();
}
