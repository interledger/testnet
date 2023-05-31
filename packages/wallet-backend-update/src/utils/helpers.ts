export const transformAmount = (value: bigint | number, scale: number) => {
  return Number(BigInt(value) / BigInt(10 ** scale))
}

export function extractUuidFromUrl(url: string): string {
  const { pathname } = new URL(url)
  const id = pathname.match(
    /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
  )?.[0]

  if (!id) {
    throw new Error('Uuid is not present in url')
  }

  return id
}
