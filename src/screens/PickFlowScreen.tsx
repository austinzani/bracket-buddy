import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { useTeams } from '../hooks/useTeams'
import {
  generateBracketGames,
  getGameParticipants,
  getRoundByRoundOrder,
  getNextUnpickedGameIndex,
  getBracketProgress,
} from '../data/bracket'
import { getTeamById } from '../data/teams'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { MatchupView } from '../components/MatchupView'
import { PickProgress } from '../components/PickProgress'

export function PickFlowScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBracket, updatePick, lockBracket } = useBrackets()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()

  const bracket = getBracket(id ?? '')

  // Generate bracket structure and game order
  const games = useMemo(() => {
    if (teams.length === 0) return new Map()
    return generateBracketGames(teams)
  }, [teams])

  const gameOrder = useMemo(() => getRoundByRoundOrder(games), [games])

  // Track current game index
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [invalidatedMessage, setInvalidatedMessage] = useState<string | null>(null)

  // On mount or when bracket changes, find the right starting position
  useEffect(() => {
    if (!bracket || gameOrder.length === 0) return

    if (currentIndex === null) {
      const resumeIndex = getNextUnpickedGameIndex(gameOrder, games, bracket.picks)
      setCurrentIndex(resumeIndex >= gameOrder.length ? gameOrder.length - 1 : resumeIndex)
    }
  }, [bracket, gameOrder, games, currentIndex])

  // Check if all picks are made — auto-lock and navigate
  useEffect(() => {
    if (!bracket) return
    const { made, total } = getBracketProgress(bracket.picks)
    if (made === total && total === 63) {
      lockBracket(bracket.bracketId)
      navigate(`/bracket/${bracket.bracketId}/view`, { replace: true })
    }
  }, [bracket, lockBracket, navigate])

  const handlePick = useCallback(
    (teamId: string) => {
      if (!bracket || currentIndex === null) return

      const gameId = gameOrder[currentIndex]
      const currentPick = bracket.picks[gameId]

      // If picking the same team, just advance
      if (currentPick === teamId) {
        if (currentIndex < gameOrder.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
        return
      }

      // Make the pick (handles downstream invalidation internally)
      const invalidated = updatePick(bracket.bracketId, gameId, teamId, games)

      if (invalidated.length > 0) {
        setInvalidatedMessage(`Changed pick — ${invalidated.length} later pick${invalidated.length > 1 ? 's' : ''} were reset`)
        setTimeout(() => setInvalidatedMessage(null), 3000)
      }

      // Auto-advance to next game
      if (currentIndex < gameOrder.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    },
    [bracket, currentIndex, gameOrder, games, updatePick],
  )

  const handleBack = useCallback(() => {
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setInvalidatedMessage(null)
    }
  }, [currentIndex])

  const handleForward = useCallback(() => {
    if (!bracket || currentIndex === null) return
    // Only allow forward if current game has a pick
    const gameId = gameOrder[currentIndex]
    if (bracket.picks[gameId] && currentIndex < gameOrder.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [bracket, currentIndex, gameOrder])

  // Loading / error states
  if (teamsLoading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '2rem' }}>🏀</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading teams...</p>
        </div>
      </Layout>
    )
  }

  if (teamsError) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '2rem' }}>😕</p>
          <p style={{ color: 'var(--color-danger)' }}>Failed to load teams: {teamsError}</p>
          <Button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Back to Home</Button>
        </div>
      </Layout>
    )
  }

  if (!bracket) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '2rem' }}>🤔</p>
          <p>Bracket not found</p>
          <Button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Back to Home</Button>
        </div>
      </Layout>
    )
  }

  if (currentIndex === null || gameOrder.length === 0) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '2rem' }}>🏀</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Setting up bracket...</p>
        </div>
      </Layout>
    )
  }

  const gameId = gameOrder[currentIndex]
  const game = games.get(gameId)!
  const [teamAId, teamBId] = getGameParticipants(gameId, games, bracket.picks)
  const teamA = teamAId ? getTeamById(teams, teamAId) : undefined
  const teamB = teamBId ? getTeamById(teams, teamBId) : undefined

  // Edge case: participants not yet determined
  if (!teamA || !teamB) {
    return (
      <Layout>
        <PickProgress
          bracketName={bracket.name}
          currentGame={game}
          currentIndex={currentIndex}
          totalGames={63}
          picksMade={getBracketProgress(bracket.picks).made}
        />
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '2rem' }}>⏳</p>
          <p>Waiting for earlier round picks to determine this matchup.</p>
          <Button onClick={handleBack} style={{ marginTop: '1rem' }}>Go Back</Button>
        </div>
      </Layout>
    )
  }

  const currentPick = bracket.picks[gameId]
  const canGoForward = currentPick && currentIndex < gameOrder.length - 1

  return (
    <Layout>
      <PickProgress
        bracketName={bracket.name}
        currentGame={game}
        currentIndex={currentIndex}
        totalGames={63}
        picksMade={getBracketProgress(bracket.picks).made}
      />

      {/* Invalidation message */}
      {invalidatedMessage && (
        <div style={{
          textAlign: 'center',
          padding: '0.5rem 1rem',
          marginBottom: '0.75rem',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          {invalidatedMessage}
        </div>
      )}

      {/* Matchup */}
      <MatchupView
        teamA={teamA}
        teamB={teamB}
        selectedTeamId={currentPick}
        onPick={handlePick}
      />

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1rem',
      }}>
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentIndex === 0}
          style={{ padding: '0.625rem 1.5rem', fontSize: '0.95rem' }}
        >
          ← Back
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate('/')}
          style={{ padding: '0.625rem 1.5rem', fontSize: '0.95rem' }}
        >
          Home
        </Button>

        {canGoForward && (
          <Button
            onClick={handleForward}
            style={{ padding: '0.625rem 1.5rem', fontSize: '0.95rem' }}
          >
            Next →
          </Button>
        )}
      </div>
    </Layout>
  )
}
