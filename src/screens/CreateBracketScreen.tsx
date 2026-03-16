import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'

const containerStyle: CSSProperties = {
  maxWidth: 480,
  margin: '3rem auto',
  textAlign: 'center',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '1rem 1.25rem',
  fontSize: '1.25rem',
  fontFamily: 'inherit',
  fontWeight: 600,
  border: '3px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  transition: 'border-color 0.15s',
  textAlign: 'center',
  backgroundColor: 'var(--color-card)',
}

export function CreateBracketScreen() {
  const navigate = useNavigate()
  const { createBracket } = useBrackets()
  const [name, setName] = useState('')

  const trimmedName = name.trim()
  const isValid = trimmedName.length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    const bracket = createBracket(trimmedName)
    navigate(`/bracket/${bracket.bracketId}`)
  }

  return (
    <Layout>
      <div style={containerStyle}>
        <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏀</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Name Your Bracket</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
          Give it a fun name so you can find it later!
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emma's Picks 🏆"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
            autoFocus
            maxLength={50}
            aria-label="Bracket name"
          />

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button type="submit" disabled={!isValid} fullWidth style={{ fontSize: '1.25rem' }}>
              Let's Go!
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
              fullWidth
              style={{ fontSize: '1rem', padding: '0.625rem 1.5rem' }}
            >
              Back to Home
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
