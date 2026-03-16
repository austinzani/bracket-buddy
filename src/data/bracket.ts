import type { Team, Region, GameId, Game } from '../types'

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest']

// Standard seed matchups for round 1: [seed1, seed2]
const SEED_MATCHUPS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13],
  [6, 11], [3, 14], [7, 10], [2, 15],
]

/**
 * Generate all 67 games for the tournament bracket (4 play-in + 63 main).
 * Returns a map of gameId -> Game.
 */
export function generateBracketGames(teams: Team[]): Map<GameId, Game> {
  const games = new Map<GameId, Game>()

  // Index non-play-in teams by region and seed
  const teamsByRegion = new Map<string, Map<number, Team>>()
  // Track play-in games: playInGameId -> [teamA, teamB]
  const playInGroups = new Map<string, Team[]>()
  // Track which region+seed slots are filled by play-in games
  const playInSlots = new Map<string, string>() // "region-seed" -> playInGameId

  for (const team of teams) {
    if (team.playInGameId) {
      // Group play-in teams by their game ID
      if (!playInGroups.has(team.playInGameId)) {
        playInGroups.set(team.playInGameId, [])
      }
      playInGroups.get(team.playInGameId)!.push(team)
      playInSlots.set(`${team.region}-${team.seed}`, team.playInGameId)
    } else {
      if (!teamsByRegion.has(team.region)) {
        teamsByRegion.set(team.region, new Map())
      }
      teamsByRegion.get(team.region)!.set(team.seed, team)
    }
  }

  // Generate play-in games (round 0)
  for (const [playInGameId, playInTeams] of playInGroups) {
    if (playInTeams.length === 2) {
      games.set(playInGameId, {
        gameId: playInGameId,
        round: 0,
        region: playInTeams[0].region,
        sourceA: playInTeams[0].id,
        sourceB: playInTeams[1].id,
        isFirstRound: true,
      })
    }
  }

  for (const region of REGIONS) {
    const regionTeams = teamsByRegion.get(region)
    if (!regionTeams) continue

    // Round 1: 8 games per region
    // Some seeds may be filled by play-in game winners instead of direct teams
    for (let g = 0; g < SEED_MATCHUPS.length; g++) {
      const [seedA, seedB] = SEED_MATCHUPS[g]
      const gameId = `${region}-R1-G${g + 1}`

      const playInA = playInSlots.get(`${region}-${seedA}`)
      const playInB = playInSlots.get(`${region}-${seedB}`)

      // If a seed has a play-in, reference the play-in game ID; otherwise use team ID directly
      const sourceA = playInA ?? (regionTeams.get(seedA)?.id ?? '')
      const sourceB = playInB ?? (regionTeams.get(seedB)?.id ?? '')
      // isFirstRound means both sources are team IDs (no prerequisite games)
      const isFirstRound = !playInA && !playInB

      games.set(gameId, {
        gameId,
        round: 1,
        region,
        sourceA,
        sourceB,
        isFirstRound,
      })
    }

    // Rounds 2-4: winners advance
    const roundGameCounts = [8, 4, 2, 1] // games per round within a region
    for (let round = 2; round <= 4; round++) {
      const gamesInRound = roundGameCounts[round - 1]
      const prevRound = round - 1
      for (let g = 0; g < gamesInRound; g++) {
        const gameId = `${region}-R${round}-G${g + 1}`
        const sourceA = `${region}-R${prevRound}-G${g * 2 + 1}`
        const sourceB = `${region}-R${prevRound}-G${g * 2 + 2}`
        games.set(gameId, {
          gameId,
          round,
          region,
          sourceA,
          sourceB,
          isFirstRound: false,
        })
      }
    }
  }

  // Final Four: 2 games
  // G1: East winner vs West winner, G2: South winner vs Midwest winner
  games.set('FinalFour-G1', {
    gameId: 'FinalFour-G1',
    round: 5,
    region: null,
    sourceA: 'East-R4-G1',
    sourceB: 'West-R4-G1',
    isFirstRound: false,
  })
  games.set('FinalFour-G2', {
    gameId: 'FinalFour-G2',
    round: 5,
    region: null,
    sourceA: 'South-R4-G1',
    sourceB: 'Midwest-R4-G1',
    isFirstRound: false,
  })

  // Championship
  games.set('Championship', {
    gameId: 'Championship',
    round: 6,
    region: null,
    sourceA: 'FinalFour-G1',
    sourceB: 'FinalFour-G2',
    isFirstRound: false,
  })

  return games
}

/**
 * Get the two team IDs that participate in a given game, based on current picks.
 * Returns [teamA, teamB] where either may be null if the prerequisite game hasn't been picked yet.
 */
export function getGameParticipants(
  gameId: GameId,
  games: Map<GameId, Game>,
  picks: Record<GameId, string>,
): [string | null, string | null] {
  const game = games.get(gameId)
  if (!game) return [null, null]

  if (game.isFirstRound) {
    return [game.sourceA || null, game.sourceB || null]
  }

  // For non-first-round games, each source is a prerequisite game ID.
  // Look up the winner of that game from picks.
  const teamA = resolveSource(game.sourceA, games, picks)
  const teamB = resolveSource(game.sourceB, games, picks)
  return [teamA, teamB]
}

/**
 * Resolve a game source to a team ID.
 * If the source is a game ID (exists in games map), look up the winner from picks.
 * Otherwise treat it as a direct team ID.
 */
function resolveSource(
  source: string,
  games: Map<GameId, Game>,
  picks: Record<GameId, string>,
): string | null {
  if (!source) return null
  if (games.has(source)) {
    // It's a game ID — look up the winner
    return picks[source] ?? null
  }
  // It's a direct team ID
  return source
}

/**
 * Get round-by-round ordered list of all game IDs.
 * Round 1 all regions, then Round 2 all regions, etc.
 */
export function getRoundByRoundOrder(games: Map<GameId, Game>): GameId[] {
  const allGames = Array.from(games.values())
  // Sort by round, then by region order, then by game number
  const regionOrder: Record<string, number> = { East: 0, West: 1, South: 2, Midwest: 3 }

  allGames.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round
    const regA = a.region ? regionOrder[a.region] : 4
    const regB = b.region ? regionOrder[b.region] : 4
    if (regA !== regB) return regA - regB
    // Extract game number from ID
    const numA = extractGameNumber(a.gameId)
    const numB = extractGameNumber(b.gameId)
    return numA - numB
  })

  return allGames.map((g) => g.gameId)
}

function extractGameNumber(gameId: string): number {
  const match = gameId.match(/G(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Get the index of the first unpicked game in the round-by-round order.
 * Returns the game order length if all games are picked.
 */
export function getNextUnpickedGameIndex(
  gameOrder: GameId[],
  games: Map<GameId, Game>,
  picks: Record<GameId, string>,
): number {
  for (let i = 0; i < gameOrder.length; i++) {
    const gameId = gameOrder[i]
    if (picks[gameId]) continue
    // Also check that both participants are available
    const [teamA, teamB] = getGameParticipants(gameId, games, picks)
    if (teamA && teamB) return i
  }
  return gameOrder.length
}

/**
 * Compute bracket progress: how many picks have been made out of total games.
 * Total is 67 with play-in games (4 play-in + 63 main bracket).
 */
export function getBracketProgress(picks: Record<GameId, string>, games?: Map<GameId, Game>): { made: number; total: number } {
  const total = games ? games.size : 67
  return { made: Object.keys(picks).length, total }
}

/**
 * When a user changes a pick in an earlier round, invalidate all downstream picks
 * that depended on the now-eliminated team.
 *
 * Returns the updated picks object and the list of invalidated game IDs.
 */
export function invalidateDownstreamPicks(
  changedGameId: GameId,
  previousWinner: string,
  games: Map<GameId, Game>,
  picks: Record<GameId, string>,
): { updatedPicks: Record<GameId, string>; invalidated: GameId[] } {
  const updatedPicks = { ...picks }
  const invalidated: GameId[] = []

  // Find all games that depend on changedGameId (directly or transitively)
  const queue = [changedGameId]
  const visited = new Set<GameId>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    // Find games whose sourceA or sourceB is currentId
    for (const [gid, game] of games) {
      if (game.isFirstRound) continue
      if (game.sourceA === currentId || game.sourceB === currentId) {
        // If the pick for this game was the now-eliminated team, invalidate
        if (updatedPicks[gid] === previousWinner) {
          delete updatedPicks[gid]
          invalidated.push(gid)
        }
        queue.push(gid)
      }
    }
  }

  return { updatedPicks, invalidated }
}
