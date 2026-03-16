import type { Team } from '../types'
import { TeamCard } from './TeamCard'
import type { CSSProperties } from 'react'

interface MatchupViewProps {
  teamA: Team
  teamB: Team
  selectedTeamId?: string
  onPick: (teamId: string) => void
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: '1.5rem',
  flex: 1,
  minHeight: 0,
  padding: '8px 0',
}

const cardWrapperStyle: CSSProperties = {
  flex: '1 1 45%',
  display: 'flex',
}

const vsStyle: CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  color: 'var(--color-text-muted)',
  userSelect: 'none',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
}

export function MatchupView({ teamA, teamB, selectedTeamId, onPick }: MatchupViewProps) {
  return (
    <div style={containerStyle} role="group" aria-label="Matchup">
      <div style={cardWrapperStyle}>
        <TeamCard
          key={teamA.id}
          team={teamA}
          selected={selectedTeamId === teamA.id}
          onClick={() => onPick(teamA.id)}
          size="large"
        />
      </div>
      <span style={vsStyle} aria-hidden="true">VS</span>
      <div style={cardWrapperStyle}>
        <TeamCard
          key={teamB.id}
          team={teamB}
          selected={selectedTeamId === teamB.id}
          onClick={() => onPick(teamB.id)}
          size="large"
        />
      </div>
    </div>
  )
}
