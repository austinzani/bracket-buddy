import type { GameId } from '../types'

interface SharePayload {
  name: string
  picks: Record<GameId, string>
}

/**
 * Encode a bracket's name and picks into a URL-safe base64 string.
 */
export function encodeBracket(name: string, picks: Record<GameId, string>): string {
  const payload: SharePayload = { name, picks }
  const json = JSON.stringify(payload)
  // btoa only handles Latin1, so encode to UTF-8 first
  const encoded = btoa(
    new TextEncoder().encode(json).reduce((s, b) => s + String.fromCharCode(b), '')
  )
  // Make URL-safe: replace +/= with -_
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a URL-safe base64 share code back into name + picks.
 * Returns null if the code is invalid.
 */
export function decodeBracket(code: string): SharePayload | null {
  try {
    // Restore standard base64
    let b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    // Add back padding
    while (b64.length % 4 !== 0) b64 += '='

    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const payload = JSON.parse(json) as SharePayload

    if (typeof payload.name !== 'string' || typeof payload.picks !== 'object') {
      return null
    }

    return payload
  } catch {
    return null
  }
}
