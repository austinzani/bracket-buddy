import { useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { BracketCard } from '../components/BracketCard'
import type { CSSProperties } from 'react'

const titleStyle: CSSProperties = {
  fontSize: '2.5rem',
  textAlign: 'center',
  marginBottom: '0.25rem',
}

const subtitleStyle: CSSProperties = {
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '1.1rem',
  marginBottom: '2rem',
}

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '3rem 1rem',
  background: 'var(--color-card)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { brackets, deleteBracket } = useBrackets()

  return (
    <Layout>
      <h1 style={titleStyle}>🏀 Bracket Buddies</h1>
      <p style={subtitleStyle}>Pick your March Madness winners!</p>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Button onClick={() => navigate('/new')} style={{ fontSize: '1.25rem', padding: '1rem 2.5rem' }}>
          Start New Bracket
        </Button>
      </div>

      {brackets.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</p>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No brackets yet!</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
            Tap "Start New Bracket" to pick your winners
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {brackets.map((bracket) => (
            <BracketCard
              key={bracket.bracketId}
              bracket={bracket}
              onContinue={(id) => navigate(`/bracket/${id}`)}
              onView={(id) => navigate(`/bracket/${id}/view`)}
              onEdit={(id) => navigate(`/bracket/${id}`)}
              onDelete={deleteBracket}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
