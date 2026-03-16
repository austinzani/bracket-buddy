import type { CSSProperties } from 'react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

const containerStyle: CSSProperties = {
  textAlign: 'center',
  padding: '4rem 1rem',
  maxWidth: 400,
  margin: '0 auto',
}

export function ErrorState({
  title = 'Oops!',
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div style={containerStyle} role="alert">
      <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }} aria-hidden="true">😕</p>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: '1rem',
        marginBottom: '1.5rem',
      }}>
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>{retryLabel}</Button>
      )}
    </div>
  )
}
