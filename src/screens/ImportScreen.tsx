import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useBrackets } from '../hooks/useBrackets'
import { decodeBracket } from '../data/shareCode'
import { Layout } from '../components/Layout'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function ImportScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { importBracket } = useBrackets()
  const imported = useRef(false)

  const code = searchParams.get('d')

  useEffect(() => {
    if (imported.current || !code) return
    imported.current = true

    const payload = decodeBracket(code)
    if (!payload) return

    const bracket = importBracket(payload.name, payload.picks)
    navigate(`/bracket/${bracket.bracketId}/view`, { replace: true })
  }, [code, importBracket, navigate])

  if (!code) {
    return (
      <Layout>
        <ErrorState
          title="Invalid Link"
          message="This share link is missing data."
          onRetry={() => navigate('/')}
          retryLabel="Go Home"
        />
      </Layout>
    )
  }

  const payload = decodeBracket(code)
  if (!payload) {
    return (
      <Layout>
        <ErrorState
          title="Invalid Link"
          message="This share link could not be decoded."
          onRetry={() => navigate('/')}
          retryLabel="Go Home"
        />
      </Layout>
    )
  }

  return <Layout><LoadingState message="Importing bracket..." /></Layout>
}
