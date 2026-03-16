import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text content', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined()
  })

  it('handles click events', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders primary variant by default with orange background', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.style.backgroundColor).toBe('var(--color-primary)')
  })

  it('renders secondary variant with blue background', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.style.backgroundColor).toBe('var(--color-secondary)')
  })

  it('renders danger variant with transparent background and border', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByRole('button')
    expect(btn.style.backgroundColor).toBe('transparent')
    expect(btn.style.border).toContain('var(--color-danger)')
  })

  it('disables the button and prevents clicks', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveProperty('disabled', true)
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('supports fullWidth prop', () => {
    render(<Button fullWidth>Full</Button>)
    const btn = screen.getByRole('button')
    expect(btn.style.width).toBe('100%')
  })
})
