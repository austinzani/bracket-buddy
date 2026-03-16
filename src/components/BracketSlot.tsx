import { forwardRef, type CSSProperties } from 'react'
import type { Team } from '../types'

interface BracketSlotProps {
  team: Team | null
  isWinner?: boolean
  compact?: boolean
}

const slotStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 4,
  minWidth: 130,
  maxWidth: 170,
  height: 28,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)',
  transition: 'opacity 0.15s',
}

const emptySlotStyle: CSSProperties = {
  ...slotStyle,
  backgroundColor: '#f0f0f0',
  color: '#bbb',
  fontStyle: 'italic',
}

export const BracketSlot = forwardRef<HTMLDivElement, BracketSlotProps>(
  function BracketSlot({ team, isWinner = false, compact = false }, ref) {
    if (!team) {
      return (
        <div ref={ref} data-bracket-slot="" style={emptySlotStyle}>
          <span style={{ fontSize: '0.7rem' }}>TBD</span>
        </div>
      )
    }

    const bgColor = isWinner ? team.primaryColor : 'var(--color-card)'
    const textColor = isWinner ? (team.secondaryColor || '#ffffff') : 'var(--color-text)'
    const opacity = isWinner ? 1 : 0.7

    return (
      <div
        ref={ref}
        data-bracket-slot=""
        data-winner={isWinner ? '' : undefined}
        style={{
          ...slotStyle,
          backgroundColor: bgColor,
          color: textColor,
          opacity,
          borderColor: isWinner ? team.primaryColor : 'var(--color-border)',
          fontWeight: isWinner ? 800 : 600,
        }}
        title={team.name}
      >
        {!compact && team.mascotImage && (
          <img
            src={team.mascotImage}
            alt=""
            style={{
              width: 18,
              height: 18,
              objectFit: 'contain',
              flexShrink: 0,
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <span style={{
          fontSize: '0.65rem',
          opacity: 0.8,
          flexShrink: 0,
        }}>
          {team.seed}
        </span>
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {team.shortName}
        </span>
      </div>
    )
  }
)
