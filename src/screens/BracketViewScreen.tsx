import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { useTeams } from '../hooks/useTeams'
import { getBracketProgress } from '../data/bracket'
import { getTeamById } from '../data/teams'
import { encodeBracket } from '../data/shareCode'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { BracketTree } from '../components/BracketTree'
import { ChampionBanner } from '../components/ChampionBanner'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function BracketViewScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBracket } = useBrackets()
  const { teams, loading: teamsLoading, error: teamsError } = useTeams()
  const [shareLabel, setShareLabel] = useState('Share Bracket')

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

  const handleEdit = () => {
    navigate(`/bracket/${bracket.bracketId}`)
  }

  const handleShare = async () => {
    const code = encodeBracket(bracket.name, bracket.picks)
    const shareUrl = `${window.location.origin}/share?d=${code}`

    // Use native share sheet on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: bracket.name,
          text: `Check out my bracket: ${bracket.name}`,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareLabel('Link Copied!')
      setTimeout(() => setShareLabel('Share Bracket'), 2000)
    } catch {
      // Last resort: prompt
      window.prompt('Copy this share link:', shareUrl)
    }
  }

  const printDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div data-bracket-page="" style={{ padding: '1rem', minHeight: '100vh' }}>
      {/* Print-only title (includes champion if complete) */}
      <div data-print-title="" style={{ display: 'none' }}>
        {bracket.name}{isComplete && champion ? ` — 🏆 #${champion.seed} ${champion.name}` : ''}
      </div>

      {/* Champion banner (only if complete) */}
      {isComplete && champion && (
        <ChampionBanner champion={champion} />
      )}

      {/* Incomplete bracket header */}
      {!isComplete && (
        <div data-print-hide="" style={{ textAlign: 'center', padding: '0.75rem 0' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{bracket.name}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {made} of {total} picks made
          </p>
        </div>
      )}

      {/* Bracket tree — full width, isolation prevents scroll area from overlaying buttons */}
      <div style={{ isolation: 'isolate' }}>
        <BracketTree teams={teams} picks={bracket.picks} />
      </div>

      {/* Print-only footer */}
      <div data-print-footer="" style={{ display: 'none' }}>
        Created with Bracket Buddy &middot; {printDate}
      </div>

      {/* Action buttons */}
      <div data-print-hide="" style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginTop: '1rem',
        paddingBottom: '1rem',
        position: 'relative',
        zIndex: 10,
      }}>
        <Button variant="secondary" onClick={handleEdit}>
          Edit Bracket
        </Button>

        <Button variant="secondary" onClick={() => {
          // Pre-apply print sizing so ResizeObserver fires and SVG connectors
          // re-measure at print dimensions before Chrome captures the page.
          // Need enough delay for: ResizeObserver → rAF → measure → React render
          document.documentElement.classList.add('print-mode')
          setTimeout(() => {
            window.print()
            document.documentElement.classList.remove('print-mode')
          }, 500)
        }}>
          Print Bracket
        </Button>

        <Button variant="secondary" onClick={handleShare}>
          {shareLabel}
        </Button>

        <Button variant="secondary" onClick={() => navigate('/new')}>
          Start Another Bracket
        </Button>

        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.875rem 2rem',
            fontSize: '1.125rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            backgroundColor: 'var(--color-secondary)',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          Home
        </a>
      </div>
    </div>
  )
}
