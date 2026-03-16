import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function PickFlowScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBracket, updatePick } = useBrackets()
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


  // Preload images for the next few matchups so transitions are instant
  const preloadedUrls = useRef(new Set<string>())
  useEffect(() => {
    if (!bracket || currentIndex === null || gameOrder.length === 0) return

    const LOOKAHEAD = 3
    for (let i = 1; i <= LOOKAHEAD; i++) {
      const idx = currentIndex + i
      if (idx >= gameOrder.length) break
      const futureGameId = gameOrder[idx]
      const [futureA, futureB] = getGameParticipants(futureGameId, games, bracket.picks)
      for (const tid of [futureA, futureB]) {
        if (!tid) continue
        const t = getTeamById(teams, tid)
        if (!t) continue
        for (const url of [t.mascotImage, t.mascotCostumeImage]) {
          if (url && !preloadedUrls.current.has(url)) {
            preloadedUrls.current.add(url)
            const img = new Image()
            img.src = url
          }
        }
      }
    }
  }, [currentIndex, bracket, gameOrder, games, teams])

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

        // Jump to first unpicked game after invalidation
        const updatedPicks = { ...bracket.picks, [gameId]: teamId }
        for (const inv of invalidated) {
          delete updatedPicks[inv]
        }
        const newCount = Object.keys(updatedPicks).length
        pickCountOnMount.current = newCount - 1 // so completion redirect still works
        const nextUnpicked = getNextUnpickedGameIndex(gameOrder, games, updatedPicks)
        setCurrentIndex(nextUnpicked >= gameOrder.length ? gameOrder.length - 1 : nextUnpicked)
        return
      }

      // Auto-advance to next game
      if (currentIndex < gameOrder.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    },
    [bracket, currentIndex, gameOrder, games, updatePick],
  )

  // After a pick is made in this session and the bracket is complete, navigate to view.
  // We track pick count so localStorage re-reads on mount don't trigger a false redirect.
  const pickCountOnMount = useRef<number | null>(null)
  useEffect(() => {
    if (!bracket) return
    const { made, total } = getBracketProgress(bracket.picks)
    if (pickCountOnMount.current === null) {
      pickCountOnMount.current = made
      return
    }
    // Only redirect if a new pick was made in this session
    if (made > pickCountOnMount.current && made === total) {
      navigate(`/bracket/${bracket.bracketId}/view`, { replace: true })
    }
  }, [bracket?.picks])

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
    return <Layout><LoadingState message="Loading teams..." /></Layout>
  }

  if (teamsError) {
    return (
      <Layout>
        <ErrorState
          message={`Failed to load teams: ${teamsError}`}
          onRetry={() => navigate('/')}
          retryLabel="Back to Home"
        />
      </Layout>
    )
  }

  if (!bracket) {
    return (
      <Layout>
        <ErrorState
          title="Not Found"
          message="Bracket not found"
          onRetry={() => navigate('/')}
          retryLabel="Back to Home"
        />
      </Layout>
    )
  }

  if (currentIndex === null || gameOrder.length === 0) {
    return <Layout><LoadingState message="Setting up bracket..." /></Layout>
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
          totalGames={gameOrder.length}
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '1rem 2rem',
      boxSizing: 'border-box',
    }}>
      <PickProgress
        bracketName={bracket.name}
        currentGame={game}
        currentIndex={currentIndex}
        totalGames={gameOrder.length}
        picksMade={getBracketProgress(bracket.picks).made}
      />

      {/* Invalidation message */}
      {invalidatedMessage && (
        <div role="alert" style={{
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

      {/* Matchup — fills remaining space */}
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
        padding: '1rem 0',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
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
          onClick={() => { window.location.href = '/' }}
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
    </div>
  )
}
