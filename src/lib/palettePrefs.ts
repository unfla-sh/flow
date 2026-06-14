/** Persisted favourite palette items (by catalog id). Recents live in the store. */

const FAV_KEY = 'wf:palette:favs'

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

/** Toggle a favourite and return the updated list. */
export function toggleFavorite(id: string): string[] {
  const current = getFavorites()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}
