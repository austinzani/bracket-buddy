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
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  padding: '1rem 0',
  flexWrap: 'wrap',
}

const vsStyle: CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  color: 'var(--color-text-muted)',
  userSelect: 'none',
  flexShrink: 0,
}

export function MatchupView({ teamA, teamB, selectedTeamId, onPick }: MatchupViewProps) {
  return (
    <div style={containerStyle}>
      <TeamCard
        team={teamA}
        selected={selectedTeamId === teamA.id}
        onClick={() => onPick(teamA.id)}
        size="large"
      />
      <span style={vsStyle}>VS</span>
      <TeamCard
        team={teamB}
        selected={selectedTeamId === teamB.id}
        onClick={() => onPick(teamB.id)}
        size="large"
      />
    </div>
  )
}
