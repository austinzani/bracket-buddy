import { useState, useEffect } from 'react'
import type { Team, Region } from '../types'
import { fetchTeams, groupTeamsByRegion } from '../data/teams'

interface UseTeamsResult {
  teams: Team[]
  teamsByRegion: Record<Region, Team[]>
  loading: boolean
  error: string | null
}

export function useTeams(): UseTeamsResult {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchTeams()
      .then((data) => {
        if (!cancelled) {
          setTeams(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load teams')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const teamsByRegion = groupTeamsByRegion(teams)

  return { teams, teamsByRegion, loading, error }
}
