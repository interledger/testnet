export function replaceHost(text: string, container: string): string {
  return text.replace('localhost', container)
}
