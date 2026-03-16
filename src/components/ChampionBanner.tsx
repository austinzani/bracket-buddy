import type { Team } from '../types'
import { TeamCard } from './TeamCard'
import type { CSSProperties } from 'react'

interface ChampionBannerProps {
  champion: Team
}

const containerStyle: CSSProperties = {
  textAlign: 'center',
  padding: '2rem 1rem',
}

const headerStyle: CSSProperties = {
  fontSize: '2.25rem',
  fontWeight: 800,
  marginBottom: '1.5rem',
  background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export function ChampionBanner({ champion }: ChampionBannerProps) {
  return (
    <div data-champion-banner="" style={containerStyle}>
      <h1 style={headerStyle}>
        🏆 Bracket Complete!
      </h1>
      <div data-champion-card="" style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1rem',
      }}>
        <TeamCard team={champion} size="large" />
      </div>
      <p style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginTop: '0.75rem',
      }}>
        Your champion: #{champion.seed} {champion.name}
      </p>
    </div>
  )
}
