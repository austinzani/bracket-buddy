import { describe, it, expect } from 'vitest'
import type { Team } from '../types'
import {
  generateBracketGames,
  getGameParticipants,
  getRoundByRoundOrder,
  getNextUnpickedGameIndex,
  getBracketProgress,
  invalidateDownstreamPicks,
} from './bracket'

/** Creates 64 teams (no play-ins) — produces a 63-game bracket */
function makeSampleTeams(): Team[] {
  const regions = ['East', 'West', 'South', 'Midwest'] as const
  const teams: Team[] = []
  for (const region of regions) {
    for (let seed = 1; seed <= 16; seed++) {
      teams.push({
        id: `${region.toLowerCase()}-${seed}`,
        name: `${region} Team ${seed}`,
        shortName: `${region[0]}${seed}`,
        seed,
        region,
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        jerseyImage: '',
        mascotImage: '',
        mascotCostumeImage: '',
      })
    }
  }
  return teams
}

/** Creates 68 teams (4 play-in pairs) — produces a 67-game bracket */
function makeSampleTeamsWithPlayIns(): Team[] {
  const regions = ['East', 'West', 'South', 'Midwest'] as const
  const teams: Team[] = []

  // Play-in config: region, seed, playInGameId
  const playIns: { region: typeof regions[number]; seed: number; gameId: string }[] = [
    { region: 'West', seed: 11, gameId: 'PlayIn-G1' },
    { region: 'South', seed: 16, gameId: 'PlayIn-G2' },
    { region: 'Midwest', seed: 11, gameId: 'PlayIn-G3' },
    { region: 'Midwest', seed: 16, gameId: 'PlayIn-G4' },
  ]

  for (const region of regions) {
    for (let seed = 1; seed <= 16; seed++) {
      const playIn = playIns.find((p) => p.region === region && p.seed === seed)

      if (playIn) {
        // Add two teams for this play-in slot
        teams.push({
          id: `${region.toLowerCase()}-${seed}a`,
          name: `${region} Team ${seed}A`,
          shortName: `${region[0]}${seed}A`,
          seed,
          region,
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          jerseyImage: '',
          mascotImage: '',
          mascotCostumeImage: '',
          playInGameId: playIn.gameId,
        })
        teams.push({
          id: `${region.toLowerCase()}-${seed}b`,
          name: `${region} Team ${seed}B`,
          shortName: `${region[0]}${seed}B`,
          seed,
          region,
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          jerseyImage: '',
          mascotImage: '',
          mascotCostumeImage: '',
          playInGameId: playIn.gameId,
        })
      } else {
        teams.push({
          id: `${region.toLowerCase()}-${seed}`,
          name: `${region} Team ${seed}`,
          shortName: `${region[0]}${seed}`,
          seed,
          region,
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          jerseyImage: '',
          mascotImage: '',
          mascotCostumeImage: '',
        })
      }
    }
  }
  return teams
}

describe('generateBracketGames (no play-ins)', () => {
  const teams = makeSampleTeams()
  const games = generateBracketGames(teams)

  it('generates 63 total games', () => {
    expect(games.size).toBe(63)
  })

  it('generates 32 round 1 games (8 per region)', () => {
    const r1 = Array.from(games.values()).filter((g) => g.round === 1)
    expect(r1.length).toBe(32)
  })

  it('generates correct round counts', () => {
    expect(Array.from(games.values()).filter((g) => g.round === 2).length).toBe(16)
    expect(Array.from(games.values()).filter((g) => g.round === 3).length).toBe(8)
    expect(Array.from(games.values()).filter((g) => g.round === 4).length).toBe(4)
    expect(Array.from(games.values()).filter((g) => g.round === 5).length).toBe(2)
    expect(Array.from(games.values()).filter((g) => g.round === 6).length).toBe(1)
  })

  it('round 1 matchups follow standard seed pairing', () => {
    const g1 = games.get('East-R1-G1')!
    expect(g1.isFirstRound).toBe(true)
    expect(g1.sourceA).toBe('east-1') // 1 seed
    expect(g1.sourceB).toBe('east-16') // 16 seed
  })

  it('round 2 sources are round 1 game IDs', () => {
    const g = games.get('East-R2-G1')!
    expect(g.isFirstRound).toBe(false)
    expect(g.sourceA).toBe('East-R1-G1')
    expect(g.sourceB).toBe('East-R1-G2')
  })

  it('Final Four sources are Elite 8 games', () => {
    const ff1 = games.get('FinalFour-G1')!
    expect(ff1.sourceA).toBe('Midwest-R4-G1')
    expect(ff1.sourceB).toBe('West-R4-G1')

    const ff2 = games.get('FinalFour-G2')!
    expect(ff2.sourceA).toBe('East-R4-G1')
    expect(ff2.sourceB).toBe('South-R4-G1')
  })

  it('Championship sources are Final Four games', () => {
    const champ = games.get('Championship')!
    expect(champ.sourceA).toBe('FinalFour-G1')
    expect(champ.sourceB).toBe('FinalFour-G2')
  })
})

describe('generateBracketGames (with play-ins)', () => {
  const teams = makeSampleTeamsWithPlayIns()
  const games = generateBracketGames(teams)

  it('generates 67 total games (4 play-in + 63 main)', () => {
    expect(games.size).toBe(67)
  })

  it('generates 4 play-in games (round 0)', () => {
    const r0 = Array.from(games.values()).filter((g) => g.round === 0)
    expect(r0.length).toBe(4)
  })

  it('play-in games have team IDs as sources', () => {
    const pi1 = games.get('PlayIn-G1')!
    expect(pi1.isFirstRound).toBe(true)
    expect(pi1.sourceA).toBe('west-11a')
    expect(pi1.sourceB).toBe('west-11b')
  })

  it('R1 games at play-in seeds reference the play-in game ID', () => {
    // West seed 11 is in SEED_MATCHUPS as [6,11] which is game 5
    const westG5 = games.get('West-R1-G5')!
    expect(westG5.sourceA).toBe('west-6') // seed 6 is a direct team
    expect(westG5.sourceB).toBe('PlayIn-G1') // seed 11 is a play-in game
    expect(westG5.isFirstRound).toBe(false) // has a play-in prerequisite
  })

  it('R1 games without play-in seeds remain isFirstRound', () => {
    const eastG1 = games.get('East-R1-G1')!
    expect(eastG1.isFirstRound).toBe(true)
    expect(eastG1.sourceA).toBe('east-1')
    expect(eastG1.sourceB).toBe('east-16')
  })

  it('still generates 32 R1 games', () => {
    const r1 = Array.from(games.values()).filter((g) => g.round === 1)
    expect(r1.length).toBe(32)
  })
})

describe('getGameParticipants', () => {
  const teams = makeSampleTeams()
  const games = generateBracketGames(teams)

  it('returns team IDs for round 1 games', () => {
    const [a, b] = getGameParticipants('East-R1-G1', games, {})
    expect(a).toBe('east-1')
    expect(b).toBe('east-16')
  })

  it('returns null for round 2 when prerequisite picks are missing', () => {
    const [a, b] = getGameParticipants('East-R2-G1', games, {})
    expect(a).toBeNull()
    expect(b).toBeNull()
  })

  it('returns picked teams for round 2', () => {
    const picks = { 'East-R1-G1': 'east-1', 'East-R1-G2': 'east-9' }
    const [a, b] = getGameParticipants('East-R2-G1', games, picks)
    expect(a).toBe('east-1')
    expect(b).toBe('east-9')
  })
})

describe('getGameParticipants (with play-ins)', () => {
  const teams = makeSampleTeamsWithPlayIns()
  const games = generateBracketGames(teams)

  it('returns team IDs for play-in games', () => {
    const [a, b] = getGameParticipants('PlayIn-G1', games, {})
    expect(a).toBe('west-11a')
    expect(b).toBe('west-11b')
  })

  it('returns null for R1 game when play-in not yet picked', () => {
    // West-R1-G5 is [6, 11] — seed 6 is direct, seed 11 is play-in
    const [a, b] = getGameParticipants('West-R1-G5', games, {})
    expect(a).toBe('west-6') // direct team ID via resolveSource
    expect(b).toBeNull() // play-in not picked yet
  })

  it('resolves R1 game after play-in is picked', () => {
    const picks = { 'PlayIn-G1': 'west-11a' }
    const [a, b] = getGameParticipants('West-R1-G5', games, picks)
    expect(a).toBe('west-6')
    expect(b).toBe('west-11a')
  })
})

describe('getRoundByRoundOrder', () => {
  it('returns 63 games in order (no play-ins)', () => {
    const teams = makeSampleTeams()
    const games = generateBracketGames(teams)
    const order = getRoundByRoundOrder(games)
    expect(order.length).toBe(63)
    expect(order[0]).toMatch(/R1/)
    expect(order[order.length - 1]).toBe('Championship')
  })

  it('returns 67 games with play-ins first', () => {
    const teams = makeSampleTeamsWithPlayIns()
    const games = generateBracketGames(teams)
    const order = getRoundByRoundOrder(games)
    expect(order.length).toBe(67)
    // Play-in games (round 0) come first
    expect(order[0]).toMatch(/PlayIn/)
    expect(order[3]).toMatch(/PlayIn/)
    // Then R1 starts
    expect(order[4]).toMatch(/R1/)
    expect(order[order.length - 1]).toBe('Championship')
  })

  it('all round 1 games come before all round 2 games', () => {
    const teams = makeSampleTeams()
    const games = generateBracketGames(teams)
    const order = getRoundByRoundOrder(games)
    const lastR1 = Math.max(...order.map((id, i) => (id.includes('R1') ? i : -1)))
    const firstR2 = order.findIndex((id) => id.includes('R2'))
    expect(lastR1).toBeLessThan(firstR2)
  })
})

describe('getBracketProgress', () => {
  it('returns 0 of 67 for empty picks (default)', () => {
    expect(getBracketProgress({})).toEqual({ made: 0, total: 67 })
  })

  it('counts picks correctly', () => {
    const picks = { 'East-R1-G1': 'east-1', 'East-R1-G2': 'east-9' }
    expect(getBracketProgress(picks)).toEqual({ made: 2, total: 67 })
  })

  it('uses games map size when provided', () => {
    const teams = makeSampleTeams()
    const games = generateBracketGames(teams)
    expect(getBracketProgress({}, games)).toEqual({ made: 0, total: 63 })
  })
})

describe('getNextUnpickedGameIndex', () => {
  const teams = makeSampleTeams()
  const games = generateBracketGames(teams)
  const order = getRoundByRoundOrder(games)

  it('returns 0 for empty picks', () => {
    expect(getNextUnpickedGameIndex(order, games, {})).toBe(0)
  })

  it('returns 1 after first pick', () => {
    const picks = { [order[0]]: 'east-1' }
    expect(getNextUnpickedGameIndex(order, games, picks)).toBe(1)
  })

  it('returns order length when all picks are made', () => {
    const picks: Record<string, string> = {}
    for (const gameId of order) {
      picks[gameId] = 'some-team'
    }
    expect(getNextUnpickedGameIndex(order, games, picks)).toBe(63)
  })
})

describe('invalidateDownstreamPicks', () => {
  const teams = makeSampleTeams()
  const games = generateBracketGames(teams)

  it('clears downstream picks when changing a round 1 pick', () => {
    const picks = {
      'East-R1-G1': 'east-1',
      'East-R1-G2': 'east-9',
      'East-R2-G1': 'east-1', // depends on east-1 winning R1-G1
    }

    const { updatedPicks, invalidated } = invalidateDownstreamPicks(
      'East-R1-G1',
      'east-1', // was the previous winner
      games,
      picks,
    )

    expect(invalidated).toContain('East-R2-G1')
    expect(updatedPicks['East-R2-G1']).toBeUndefined()
    // R1-G2 pick should still be there
    expect(updatedPicks['East-R1-G2']).toBe('east-9')
  })

  it('does not invalidate downstream picks for a different team', () => {
    const picks = {
      'East-R1-G1': 'east-1',
      'East-R1-G2': 'east-9',
      'East-R2-G1': 'east-9', // picked east-9, not east-1
    }

    const { updatedPicks, invalidated } = invalidateDownstreamPicks(
      'East-R1-G1',
      'east-1',
      games,
      picks,
    )

    expect(invalidated).toEqual([])
    expect(updatedPicks['East-R2-G1']).toBe('east-9')
  })
})

describe('invalidateDownstreamPicks (with play-ins)', () => {
  const teams = makeSampleTeamsWithPlayIns()
  const games = generateBracketGames(teams)

  it('invalidates R1 pick when play-in pick changes', () => {
    const picks = {
      'PlayIn-G1': 'west-11a',
      'West-R1-G5': 'west-11a', // picked the play-in winner to advance past R1
    }

    const { updatedPicks, invalidated } = invalidateDownstreamPicks(
      'PlayIn-G1',
      'west-11a',
      games,
      picks,
    )

    expect(invalidated).toContain('West-R1-G5')
    expect(updatedPicks['West-R1-G5']).toBeUndefined()
  })
})
