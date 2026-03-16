import type { CSSProperties } from 'react'
import type { Game } from '../types'

interface PickProgressProps {
  bracketName: string
  currentGame: Game
  currentIndex: number
  totalGames: number
  picksMade: number
}

const ROUND_NAMES: Record<number, string> = {
  0: 'First Four',
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--color-card)',
  borderRadius: 'var(--radius-sm)',
  boxShadow: 'var(--shadow)',
  marginBottom: '1rem',
}

const tagStyle: CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: 999,
  fontSize: '0.85rem',
  fontWeight: 700,
}

export function PickProgress({ bracketName, currentGame, currentIndex, totalGames, picksMade }: PickProgressProps) {
  const roundName = ROUND_NAMES[currentGame.round] ?? `Round ${currentGame.round}`
  const regionLabel = currentGame.region ? `${currentGame.region} — ` : ''
  const progressPct = Math.round((picksMade / totalGames) * 100)

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{bracketName}</span>
        <span style={{
          ...tagStyle,
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
        }}>
          {regionLabel}{roundName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Game {currentIndex + 1} of {totalGames}
        </span>

        {/* Mini progress bar */}
        <div
          style={{
            width: 100,
            height: 6,
            backgroundColor: 'var(--color-border)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={picksMade}
          aria-valuemin={0}
          aria-valuemax={totalGames}
          aria-label={`${picksMade} of ${totalGames} picks made`}
        >
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: 'var(--color-primary)',
            borderRadius: 3,
            transition: 'width 0.3s',
          }} />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {picksMade}/63
        </span>
      </div>
    </div>
  )
}
