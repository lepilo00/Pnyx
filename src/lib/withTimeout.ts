// Races a promise against a timeout so a slow/unreachable network call
// (e.g. Supabase being unreachable) never blocks the UI indefinitely.
// Resolves to null if the timeout wins or the promise rejects.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(null)
      })
  })
}
