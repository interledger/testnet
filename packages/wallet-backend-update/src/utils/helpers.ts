export const formatBalance = (value: bigint | number, scale = 2): bigint => {
  return BigInt(transformAmount(value, scale).toFixed(2))
}

export const transformAmount = (value: bigint | number, scale = 2) => {
  return Number(BigInt(value) / BigInt(10 ** scale))
}
