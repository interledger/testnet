// TODO: Support multiple scales
export const formatBalance = (value: number): string => {
  return (value * 100 * 10 ** -2).toFixed(2)
}
