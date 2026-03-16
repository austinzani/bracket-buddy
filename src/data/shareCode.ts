import type { GameId, Team } from '../types'
import { generateBracketGames, getRoundByRoundOrder, getGameParticipants } from './bracket'

interface SharePayload {
  name: string
  picks: Record<GameId, string>
}

// --- V1: Legacy JSON-based encoding (kept for backward compat) ---

function decodeBracketV1(code: string): SharePayload | null {
  try {
    let b64 = code.replace(/-/g, '+').replace(/_/g, '/')
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

// --- V2: Compact bit-per-pick encoding ---
// Each pick is encoded as "0" (sourceA won) or "1" (sourceB won)
// in deterministic game order. ~67 chars for picks + URL-encoded name.

/**
 * Encode picks compactly: one character per pick in deterministic game order.
 * "0" = first participant (sourceA) won, "1" = second participant (sourceB) won.
 */
function encodeBracketV2(
  picks: Record<GameId, string>,
  teams: Team[],
): string {
  const games = generateBracketGames(teams)
  const order = getRoundByRoundOrder(games)

  let bits = ''
  for (const gameId of order) {
    const winner = picks[gameId]
    if (!winner) {
      bits += '-' // unpicked
      continue
    }

    const [teamA, teamB] = getGameParticipants(gameId, games, picks)

    if (winner === teamA) {
      bits += '0'
    } else if (winner === teamB) {
      bits += '1'
    } else {
      bits += '-' // shouldn't happen, but be safe
    }
  }

  // Trim trailing dashes (unpicked games at the end)
  bits = bits.replace(/-+$/, '')

  return bits
}

/**
 * Decode compact picks string back into full picks record.
 * Walks through games in order, resolving participants from prior picks.
 */
function decodeBracketV2(
  bits: string,
  teams: Team[],
): Record<GameId, string> | null {
  try {
    const games = generateBracketGames(teams)
    const order = getRoundByRoundOrder(games)
    const picks: Record<GameId, string> = {}

    for (let i = 0; i < order.length; i++) {
      const bit = i < bits.length ? bits[i] : '-'
      if (bit === '-') continue

      const gameId = order[i]
      const [teamA, teamB] = getGameParticipants(gameId, games, picks)

      if (bit === '0' && teamA) {
        picks[gameId] = teamA
      } else if (bit === '1' && teamB) {
        picks[gameId] = teamB
      }
      // If participants aren't resolved yet, skip (shouldn't happen with valid data)
    }

    return picks
  } catch {
    return null
  }
}

// --- Public API ---

/**
 * Encode a bracket for sharing. Uses compact V2 format.
 * Returns query string parameters (without leading ?).
 */
export function encodeBracket(
  name: string,
  picks: Record<GameId, string>,
  teams: Team[],
): string {
  const bits = encodeBracketV2(picks, teams)
  const params = new URLSearchParams({ v: '2', n: name, p: bits })
  return params.toString()
}

/**
 * Decode a shared bracket from URL search params.
 * Supports both V1 (legacy) and V2 (compact) formats.
 */
export function decodeBracket(
  searchParams: URLSearchParams,
  teams: Team[],
): SharePayload | null {
  const version = searchParams.get('v')

  if (version === '2') {
    const name = searchParams.get('n')
    const bits = searchParams.get('p')
    if (!name || !bits) return null

    const picks = decodeBracketV2(bits, teams)
    if (!picks) return null

    return { name, picks }
  }

  // V1 fallback: single 'd' parameter with base64 JSON
  const code = searchParams.get('d')
  if (code) {
    return decodeBracketV1(code)
  }

  return null
}
