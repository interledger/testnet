import { proxy, subscribe } from 'valtio'

export function resetStore<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends Record<string, any>
>(store: T, defaults: E) {
  for (const key in defaults) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    store[key] = defaults[key]
  }
}

export function valtioPersist<TState extends object>(
  localStorageKey: string,
  initialState?: TState
): TState {
  const data = localStorage.getItem(localStorageKey)
  const proxiedData = proxy(data !== null ? JSON.parse(data) : initialState)
  subscribe(proxiedData, () =>
    localStorage.setItem(localStorageKey, JSON.stringify(proxiedData))
  )
  return proxiedData
}
