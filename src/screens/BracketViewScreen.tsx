import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { useTeams } from '../hooks/useTeams'
import { getBracketProgress } from '../data/bracket'
import { getTeamById } from '../data/teams'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { BracketTree } from '../components/BracketTree'
import { ChampionBanner } from '../components/ChampionBanner'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function BracketViewScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBracket, unlockBracket } = useBrackets()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)

  const bracket = getBracket(id ?? '')

  if (teamsLoading) {
    return <Layout><LoadingState /></Layout>
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

  const { made, total } = getBracketProgress(bracket.picks)
  const isComplete = made === total
  const championId = bracket.picks['Championship']
  const champion = championId ? getTeamById(teams, championId) : undefined

  const handleUnlock = () => {
    unlockBracket(bracket.bracketId)
    navigate(`/bracket/${bracket.bracketId}`)
  }

  const printDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <Layout>
      {/* Print-only title */}
      <div data-print-title="" style={{ display: 'none' }}>
        {bracket.name}
      </div>

      {/* Champion banner (only if complete) */}
      {isComplete && champion && (
        <ChampionBanner champion={champion} />
      )}

      {/* Incomplete bracket header */}
      {!isComplete && (
        <div data-print-hide="" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{bracket.name}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {made} of {total} picks made
          </p>
        </div>
      )}

      {/* Bracket tree */}
      <BracketTree teams={teams} picks={bracket.picks} />

      {/* Print-only footer */}
      <div data-print-footer="" style={{ display: 'none' }}>
        Created with Bracket Buddies &middot; {printDate}
      </div>

      {/* Action buttons */}
      <div data-print-hide="" style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginTop: '2rem',
        paddingBottom: '2rem',
      }}>
        {bracket.locked ? (
          showUnlockConfirm ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Are you sure? This will let you change your picks.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="danger" onClick={handleUnlock}>
                  Yes, Unlock
                </Button>
                <Button variant="secondary" onClick={() => setShowUnlockConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowUnlockConfirm(true)}>
              🔓 Unlock to Edit
            </Button>
          )
        ) : (
          <Button onClick={() => navigate(`/bracket/${bracket.bracketId}`)}>
            Continue Picking
          </Button>
        )}

        <Button variant="secondary" onClick={() => window.print()}>
          🖨️ Print Bracket
        </Button>

        <Button variant="secondary" onClick={() => navigate('/new')}>
          Start Another Bracket
        </Button>

        <Button variant="secondary" onClick={() => navigate('/')}>
          Home
        </Button>
      </div>
    </Layout>
  )
}
