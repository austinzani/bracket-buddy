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

describe('generateBracketGames', () => {
  const teams = makeSampleTeams()
  const games = generateBracketGames(teams)

  it('generates 63 total games', () => {
    expect(games.size).toBe(63)
  })

  it('generates 32 round 1 games (8 per region)', () => {
    const r1 = Array.from(games.values()).filter((g) => g.round === 1)
    expect(r1.length).toBe(32)
  })

  it('generates 16 round 2 games', () => {
    const r2 = Array.from(games.values()).filter((g) => g.round === 2)
    expect(r2.length).toBe(16)
  })

  it('generates 8 Sweet 16 games', () => {
    const r3 = Array.from(games.values()).filter((g) => g.round === 3)
    expect(r3.length).toBe(8)
  })

  it('generates 4 Elite 8 games', () => {
    const r4 = Array.from(games.values()).filter((g) => g.round === 4)
    expect(r4.length).toBe(4)
  })

  it('generates 2 Final Four games', () => {
    const r5 = Array.from(games.values()).filter((g) => g.round === 5)
    expect(r5.length).toBe(2)
  })

  it('generates 1 Championship game', () => {
    const r6 = Array.from(games.values()).filter((g) => g.round === 6)
    expect(r6.length).toBe(1)
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
    expect(ff1.sourceA).toBe('East-R4-G1')
    expect(ff1.sourceB).toBe('West-R4-G1')
  })

  it('Championship sources are Final Four games', () => {
    const champ = games.get('Championship')!
    expect(champ.sourceA).toBe('FinalFour-G1')
    expect(champ.sourceB).toBe('FinalFour-G2')
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

describe('getRoundByRoundOrder', () => {
  const teams = makeSampleTeams()
  const games = generateBracketGames(teams)
  const order = getRoundByRoundOrder(games)

  it('returns 63 games in order', () => {
    expect(order.length).toBe(63)
  })

  it('starts with round 1 games', () => {
    expect(order[0]).toMatch(/R1/)
  })

  it('ends with Championship', () => {
    expect(order[order.length - 1]).toBe('Championship')
  })

  it('all round 1 games come before all round 2 games', () => {
    const lastR1 = Math.max(...order.map((id, i) => (id.includes('R1') ? i : -1)))
    const firstR2 = order.findIndex((id) => id.includes('R2'))
    expect(lastR1).toBeLessThan(firstR2)
  })
})

describe('getBracketProgress', () => {
  it('returns 0 of 63 for empty picks', () => {
    expect(getBracketProgress({})).toEqual({ made: 0, total: 63 })
  })

  it('counts picks correctly', () => {
    const picks = { 'East-R1-G1': 'east-1', 'East-R1-G2': 'east-9' }
    expect(getBracketProgress(picks)).toEqual({ made: 2, total: 63 })
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
    // Make all 63 picks (just fill with dummy values to count)
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
