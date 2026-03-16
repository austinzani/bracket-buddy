import type { Team } from '../types'
import { TeamCard } from './TeamCard'
import { useIsMobile } from '../hooks/useIsMobile'
import type { CSSProperties } from 'react'

interface MatchupViewProps {
  teamA: Team
  teamB: Team
  selectedTeamId?: string
  onPick: (teamId: string) => void
}

const vsStyle: CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  color: 'var(--color-text-muted)',
  userSelect: 'none',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function MatchupView({ teamA, teamB, selectedTeamId, onPick }: MatchupViewProps) {
  const isMobile = useIsMobile()

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: isMobile ? '0.75rem' : '1.5rem',
    flex: 1,
    minHeight: 0,
    padding: '8px 0',
  }

  const cardWrapperStyle: CSSProperties = {
    flex: isMobile ? '1 1 0' : '1 1 45%',
    display: 'flex',
    minHeight: 0,
  }

  return (
    <div style={containerStyle} role="group" aria-label="Matchup">
      <div style={cardWrapperStyle}>
        <TeamCard
          key={teamA.id}
          team={teamA}
          selected={selectedTeamId === teamA.id}
          onClick={() => onPick(teamA.id)}
          size="large"
          horizontal={isMobile}
        />
      </div>
      <span style={{
        ...vsStyle,
        fontSize: isMobile ? '1.5rem' : '2.5rem',
      }} aria-hidden="true">VS</span>
      <div style={cardWrapperStyle}>
        <TeamCard
          key={teamB.id}
          team={teamB}
          selected={selectedTeamId === teamB.id}
          onClick={() => onPick(teamB.id)}
          size="large"
          horizontal={isMobile}
        />
      </div>
    </div>
  )
}
