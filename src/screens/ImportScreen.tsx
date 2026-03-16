import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { useTeams } from '../hooks/useTeams'
import { decodeBracket } from '../data/shareCode'
import { Layout } from '../components/Layout'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function ImportScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { importBracket } = useBrackets()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const imported = useRef(false)

  useEffect(() => {
    if (imported.current || teamsLoading || teams.length === 0) return

    const payload = decodeBracket(searchParams, teams)
    if (!payload) return

    imported.current = true
    const bracket = importBracket(payload.name, payload.picks)
    navigate(`/bracket/${bracket.bracketId}/view`, { replace: true })
  }, [searchParams, teams, teamsLoading, importBracket, navigate])

  if (teamsLoading) {
    return <Layout><LoadingState message="Loading..." /></Layout>
  }

  if (teamsError) {
    return (
      <Layout>
        <ErrorState
          message={`Failed to load teams: ${teamsError}`}
          onRetry={() => navigate('/')}
          retryLabel="Go Home"
        />
      </Layout>
    )
  }

  // Check if the link is valid (for immediate error display)
  const payload = decodeBracket(searchParams, teams)
  if (!payload) {
    return (
      <Layout>
        <ErrorState
          title="Invalid Link"
          message="This share link could not be decoded."
          onRetry={() => navigate('/')}
          retryLabel="Go Home"
        />
      </Layout>
    )
  }

  return <Layout><LoadingState message="Importing bracket..." /></Layout>
}
