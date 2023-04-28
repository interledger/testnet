// TODO: Support multiple scales
export const formatBalance = (value: number): string => {
  return (value * 100 * 10 ** -2).toFixed(2)
}

export const transformAmount = (value: bigint | number, scale = 2) => {
  return Number(BigInt(value) / BigInt(10 ** scale))
}
