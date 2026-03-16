import type { Team } from '../types'
import type { CSSProperties } from 'react'

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

interface ChampionBannerProps {
  champion: Team
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '0.75rem 1rem',
  flexWrap: 'wrap',
}

export function ChampionBanner({ champion }: ChampionBannerProps) {
  const textColor = getContrastColor(champion.primaryColor)

  return (
    <div data-champion-banner="" style={containerStyle}>
      <h1 style={{
        fontSize: '1.25rem',
        fontWeight: 800,
        margin: 0,
        background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        🏆 Bracket Complete!
      </h1>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '6px 16px',
        borderRadius: 8,
        backgroundColor: champion.primaryColor,
        color: textColor,
        fontWeight: 800,
        fontSize: '1rem',
        border: `2px solid ${champion.primaryColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {champion.mascotImage && (
          <img
            src={champion.mascotImage}
            alt=""
            style={{ width: 24, height: 24, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        #{champion.seed} {champion.name}
      </div>
    </div>
  )
}
