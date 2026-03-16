import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TeamCard } from './TeamCard'
import type { Team } from '../types'

const makeTeam = (overrides?: Partial<Team>): Team => ({
  id: 'duke',
  name: 'Duke Blue Devils',
  shortName: 'Duke',
  seed: 1,
  region: 'East',
  primaryColor: '#003087',
  secondaryColor: '#FFFFFF',
  jerseyImage: '/assets/jerseys/duke.png',
  mascotImage: '/assets/mascots/duke.png',
  mascotCostumeImage: '',
  ...overrides,
})

describe('TeamCard', () => {
  it('renders team name', () => {
    render(<TeamCard team={makeTeam()} />)
    expect(screen.getByText('Duke Blue Devils')).toBeDefined()
  })

  it('renders seed badge', () => {
    render(<TeamCard team={makeTeam()} />)
    expect(screen.getByText('#1')).toBeDefined()
  })

  it('has white background with team color border', () => {
    const { container } = render(<TeamCard team={makeTeam()} />)
    const card = container.firstChild as HTMLElement
    expect(card.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(card.style.border).toContain('rgb(0, 48, 135)')
  })

  it('renders mascot image', () => {
    render(<TeamCard team={makeTeam()} />)
    const img = screen.getByAltText('Duke Blue Devils mascot')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/assets/mascots/duke.png')
  })

  it('shows fallback when mascot image is empty', () => {
    render(<TeamCard team={makeTeam({ mascotImage: '' })} />)
    // Should show basketball fallback, no broken image
    expect(screen.queryByAltText('Duke Blue Devils mascot')).toBeNull()
    expect(screen.getAllByText('🏀').length).toBeGreaterThan(0)
  })

  it('handles mascot image error by showing fallback', () => {
    render(<TeamCard team={makeTeam()} />)
    const img = screen.getByAltText('Duke Blue Devils mascot')
    fireEvent.error(img)
    // After error, the image should be replaced by fallback
    expect(screen.getAllByText('🏀').length).toBeGreaterThan(0)
  })

  it('shows checkmark when selected', () => {
    render(<TeamCard team={makeTeam()} selected />)
    expect(screen.getByText('✓')).toBeDefined()
  })

  it('does not show checkmark when not selected', () => {
    render(<TeamCard team={makeTeam()} />)
    expect(screen.queryByText('✓')).toBeNull()
  })

  it('has aria-label with "Pick" when onClick provided', () => {
    const onClick = vi.fn()
    render(<TeamCard team={makeTeam()} onClick={onClick} />)
    expect(screen.getByRole('button', { name: 'Pick Duke Blue Devils' })).toBeDefined()
  })

  it('does not have button role when onClick not provided', () => {
    render(<TeamCard team={makeTeam()} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<TeamCard team={makeTeam()} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onClick on Enter key', () => {
    const onClick = vi.fn()
    render(<TeamCard team={makeTeam()} onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onClick on Space key', () => {
    const onClick = vi.fn()
    render(<TeamCard team={makeTeam()} onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders large variant', () => {
    const { container } = render(<TeamCard team={makeTeam()} size="large" />)
    const card = container.firstChild as HTMLElement
    expect(card.style.width).toBe('100%')
    expect(card.style.height).toBe('100%')
  })
})
