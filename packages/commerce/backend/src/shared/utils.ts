// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

export function deleteProperty<T, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: _, ...newObj } = obj
  return newObj
}
