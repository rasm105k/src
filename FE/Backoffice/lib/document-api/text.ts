export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (!/[ÃÂ]/.test(text)) return text

  try {
    const bytes = Uint8Array.from([...text].map(char => char.charCodeAt(0) & 0xff))
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    if (decoded && replacementScore(decoded) <= replacementScore(text)) {
      return decoded
    }
  } catch {
    // Fall back to targeted replacements below.
  }

  return text
    .replaceAll('Ã¦', 'æ')
    .replaceAll('Ã¸', 'ø')
    .replaceAll('Ã¥', 'å')
    .replaceAll('Ã†', 'Æ')
    .replaceAll('Ã˜', 'Ø')
    .replaceAll('Ã…', 'Å')
    .replaceAll('Â·', '·')
    .replaceAll('Â', '')
}

function replacementScore(value: string): number {
  return (value.match(/[ÃÂ�]/g) ?? []).length
}
