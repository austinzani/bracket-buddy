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
  const [jerseyError, setJerseyError] = useState(false)
  const [mascotLoaded, setMascotLoaded] = useState(false)
  const [jerseyLoaded, setJerseyLoaded] = useState(false)

  const isLarge = size === 'large'
  const cardHeight = isLarge ? 420 : 340
  const textColor = team.secondaryColor || getContrastColor(team.primaryColor)
  const hasMascot = team.mascotImage && !mascotError
  const hasJersey = team.jerseyImage && !jerseyError

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  const cardStyle: CSSProperties = {
    position: 'relative',
    backgroundColor: team.primaryColor,
    borderRadius: 'var(--radius)',
    width: isLarge ? 340 : 280,
    height: cardHeight,
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
    outline: 'none',
    border: selected ? `4px solid ${textColor}` : '4px solid transparent',
    boxShadow: selected
      ? `0 0 0 4px ${team.primaryColor}, 0 8px 24px rgba(0,0,0,0.25)`
      : 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#ffffff',
        fontSize: isLarge ? '1rem' : '0.85rem',
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

      {/* Mascot image area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
        minHeight: 0,
      }}>
        {hasMascot ? (
          <>
            {!mascotLoaded && (
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '60%',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
              }} />
            )}
            <img
              src={team.mascotImage}
              alt={`${team.name} mascot`}
              loading="lazy"
              onError={() => setMascotError(true)}
              onLoad={() => setMascotLoaded(true)}
              style={{
                maxHeight: '65%',
                maxWidth: '70%',
                objectFit: 'contain',
                opacity: mascotLoaded ? 1 : 0,
                transition: 'opacity 0.2s',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            />
          </>
        ) : (
          <div style={{
            fontSize: isLarge ? '4rem' : '3rem',
            opacity: 0.3,
          }}>
            🏀
          </div>
        )}
      </div>

      {/* Jersey image (smaller, bottom-left) */}
      {hasJersey && (
        <>
          {!jerseyLoaded && null}
          <img
            src={team.jerseyImage}
            alt={`${team.name} jersey`}
            loading="lazy"
            onError={() => setJerseyError(true)}
            onLoad={() => setJerseyLoaded(true)}
            style={{
              position: 'absolute',
              bottom: 48,
              left: 12,
              height: isLarge ? 72 : 56,
              objectFit: 'contain',
              opacity: jerseyLoaded ? 0.85 : 0,
              transition: 'opacity 0.2s',
              filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))',
            }}
          />
        </>
      )}

      {/* Team name */}
      <div style={{
        width: '100%',
        padding: '12px 16px',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}>
        <span style={{
          color: textColor,
          fontSize: isLarge ? '1.5rem' : '1.2rem',
          fontWeight: 800,
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}>
          {team.shortName}
        </span>
      </div>
    </div>
  )
}
