import type { Team, Region } from '../types'

const REQUIRED_FIELDS = ['id', 'name', 'shortName', 'seed', 'region', 'primaryColor', 'secondaryColor'] as const

function validateTeam(obj: unknown, index: number): Team {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`Team at index ${index} is not an object`)
  }
  const record = obj as Record<string, unknown>
  for (const field of REQUIRED_FIELDS) {
    if (!(field in record)) {
      throw new Error(`Team at index ${index} is missing required field "${field}"`)
    }
  }
  return {
    id: String(record.id),
    name: String(record.name),
    shortName: String(record.shortName),
    seed: Number(record.seed),
    region: String(record.region) as Region,
    primaryColor: String(record.primaryColor),
    secondaryColor: String(record.secondaryColor),
    jerseyImage: String(record.jerseyImage ?? ''),
    mascotImage: String(record.mascotImage ?? ''),
  }
}

export async function fetchTeams(): Promise<Team[]> {
  const response = await fetch('/data/teams.json')
  if (!response.ok) {
    throw new Error(`Failed to load teams: ${response.status} ${response.statusText}`)
  }
  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('teams.json must be an array')
  }
  return data.map((item, i) => validateTeam(item, i))
}

export function groupTeamsByRegion(teams: Team[]): Record<Region, Team[]> {
  const grouped: Record<Region, Team[]> = {
    East: [],
    West: [],
    South: [],
    Midwest: [],
  }
  for (const team of teams) {
    grouped[team.region].push(team)
  }
  // Sort by seed within each region
  for (const region of Object.keys(grouped) as Region[]) {
    grouped[region].sort((a, b) => a.seed - b.seed)
  }
  return grouped
}

export function getTeamById(teams: Team[], id: string): Team | undefined {
  return teams.find((t) => t.id === id)
}
