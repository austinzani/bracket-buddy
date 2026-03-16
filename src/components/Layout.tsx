import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      padding: '2rem 1.5rem',
      minHeight: '100vh',
    }}>
      {children}
    </div>
  )
}
