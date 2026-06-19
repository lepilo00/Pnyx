// Races a promise against a timeout so a slow/unreachable network call
// (e.g. Supabase being unreachable) never blocks the UI indefinitely.
// Resolves to null if the timeout wins or the promise rejects.
//
// Accepts PromiseLike (not Promise) because Supabase's query builder is a
// thenable, not a real Promise — it only implements .then(), not
// .catch()/.finally(), so we use the two-argument .then() form here.
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    promise.then(
      (result) => {
        clearTimeout(timer)
        resolve(result)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      }
    )
  })
}
