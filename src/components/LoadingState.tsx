import type { CSSProperties } from 'react'

interface LoadingStateProps {
  message?: string
}

const containerStyle: CSSProperties = {
  textAlign: 'center',
  padding: '4rem 1rem',
}

const bounceKeyframes = `
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
}
`

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div style={containerStyle}>
      <style>{bounceKeyframes}</style>
      <div style={{ fontSize: '3rem', animation: 'bounce 1s ease infinite' }} aria-hidden="true">
        🏀
      </div>
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: '1.1rem',
        marginTop: '1rem',
        fontWeight: 600,
      }} role="status">
        {message}
      </p>
    </div>
  )
}
