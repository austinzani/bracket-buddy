import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Team } from '../types'

interface TeamCardProps {
  team: Team
  selected?: boolean
  onClick?: () => void
  size?: 'normal' | 'large'
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

export function TeamCard({ team, selected = false, onClick, size = 'normal' }: TeamCardProps) {
  const [mascotError, setMascotError] = useState(false)
  const [costumeError, setCostumeError] = useState(false)

  const isLarge = size === 'large'
  const textColor = getContrastColor(team.primaryColor)
  const hasMascot = team.mascotImage && !mascotError
  const hasCostume = team.mascotCostumeImage && !costumeError

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  const cardStyle: CSSProperties = {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 'var(--radius)',
    width: isLarge ? '100%' : 280,
    height: isLarge ? '100%' : 340,
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
    outline: 'none',
    border: `4px solid ${team.primaryColor}`,
    boxShadow: selected
      ? `0 0 0 4px ${team.primaryColor}, 0 8px 24px rgba(0,0,0,0.25)`
      : 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  }

  const imageSlotStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
  }

  const imgStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Pick ${team.name}` : team.name}
      aria-pressed={onClick ? selected : undefined}
      style={cardStyle}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.3)`
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = selected
          ? `0 0 0 4px ${team.primaryColor}, 0 8px 24px rgba(0,0,0,0.25)`
          : 'var(--shadow)'
      }}
      onFocus={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = `0 0 0 4px rgba(74,144,217,0.6), 0 8px 24px rgba(0,0,0,0.25)`
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = selected
          ? `0 0 0 4px ${team.primaryColor}, 0 8px 24px rgba(0,0,0,0.25)`
          : 'var(--shadow)'
      }}
    >
      {/* Seed badge */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: team.primaryColor,
        color: textColor,
        fontSize: isLarge ? '1.1rem' : '0.85rem',
        fontWeight: 800,
        padding: '4px 10px',
        borderRadius: 8,
        zIndex: 2,
      }}>
        #{team.seed}
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          backgroundColor: '#27ae60',
          color: '#ffffff',
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 800,
          zIndex: 2,
        }} aria-hidden="true">
          ✓
        </div>
      )}

      {/* Images stacked vertically, equal space */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 0,
        padding: isLarge ? '12px 16px' : '8px 12px',
        boxSizing: 'border-box',
        gap: isLarge ? 8 : 4,
      }}>
        {/* Mascot / logo image */}
        <div style={imageSlotStyle}>
          {hasMascot ? (
            <img
              src={team.mascotImage}
              alt={`${team.name} mascot`}
              onError={() => setMascotError(true)}
              style={imgStyle}
            />
          ) : (
            <div style={{ fontSize: isLarge ? '5rem' : '3rem', opacity: 0.3 }}>🏀</div>
          )}
        </div>

        {/* Mascot costume image */}
        <div style={imageSlotStyle}>
          {hasCostume ? (
            <img
              src={team.mascotCostumeImage}
              alt={`${team.name} mascot costume`}
              onError={() => setCostumeError(true)}
              style={imgStyle}
            />
          ) : (
            <div style={{ fontSize: isLarge ? '5rem' : '3rem', opacity: 0.3 }}>🏀</div>
          )}
        </div>
      </div>

      {/* Team name bar with team color */}
      <div style={{
        width: '100%',
        padding: isLarge ? '16px 16px' : '12px 16px',
        textAlign: 'center',
        backgroundColor: team.primaryColor,
        flexShrink: 0,
      }}>
        <span style={{
          color: textColor,
          fontSize: isLarge ? '1.5rem' : '1.2rem',
          fontWeight: 800,
        }}>
          {team.name}
        </span>
      </div>
    </div>
  )
}
