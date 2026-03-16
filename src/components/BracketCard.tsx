import { useState, type CSSProperties } from 'react'
import type { Bracket } from '../types'
import { getBracketProgress } from '../data/bracket'
import { Button } from './Button'

interface BracketCardProps {
  bracket: Bracket
  onContinue: (bracketId: string) => void
  onView: (bracketId: string) => void
  onEdit: (bracketId: string) => void
  onDelete: (bracketId: string) => void
}

const cardStyle: CSSProperties = {
  background: 'var(--color-card)',
  borderRadius: 'var(--radius)',
  padding: '1.25rem 1.5rem',
  boxShadow: 'var(--shadow)',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  transition: 'box-shadow 0.15s',
}

const progressBarBg: CSSProperties = {
  height: 8,
  borderRadius: 4,
  backgroundColor: 'var(--color-border)',
  flex: 1,
  overflow: 'hidden',
}

export function BracketCard({ bracket, onContinue, onView, onEdit, onDelete }: BracketCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { made, total } = getBracketProgress(bracket.picks)
  const isComplete = made === total
  const progressPct = Math.round((made / total) * 100)

  const createdDate = new Date(bracket.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={cardStyle}>
      {/* Info section */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bracket.name}
          </h3>
          {isComplete && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#27ae60',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 999,
            }}>
              Complete
            </span>
          )}
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>
          Created {createdDate}
        </p>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={progressBarBg}
            role="progressbar"
            aria-valuenow={made}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${made} of ${total} picks made`}
          >
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              backgroundColor: isComplete ? '#27ae60' : 'var(--color-primary)',
              borderRadius: 4,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {made} of {total} picks
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        {isComplete ? (
          <>
            <Button variant="secondary" onClick={() => onView(bracket.bracketId)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              View
            </Button>
            <Button variant="secondary" onClick={() => onEdit(bracket.bracketId)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              Edit
            </Button>
          </>
        ) : (
          <Button onClick={() => onContinue(bracket.bracketId)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            Continue
          </Button>
        )}

        {confirmingDelete ? (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <Button
              variant="danger"
              onClick={() => { onDelete(bracket.bracketId); setConfirmingDelete(false) }}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            >
              Yes, delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="danger"
            onClick={() => setConfirmingDelete(true)}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
            aria-label={`Delete ${bracket.name}`}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
