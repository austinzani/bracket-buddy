import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBrackets } from './useBrackets'

// We need @testing-library/react for hook testing
// Install check is handled by the test runner

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useBrackets', () => {
  it('returns empty brackets on first load', () => {
    const { result } = renderHook(() => useBrackets())
    expect(result.current.brackets).toEqual([])
    expect(result.current.storageError).toBeNull()
  })

  it('creates a bracket and persists to localStorage', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.createBracket>
    act(() => {
      bracket = result.current.createBracket("Emma's Bracket")
    })

    expect(result.current.brackets).toHaveLength(1)
    expect(result.current.brackets[0].name).toBe("Emma's Bracket")
    expect(result.current.brackets[0].locked).toBe(false)
    expect(result.current.brackets[0].picks).toEqual({})
    expect(bracket!.bracketId).toBeTruthy()

    // Verify localStorage
    const stored = JSON.parse(localStorage.getItem('mmBrackets')!)
    expect(stored.brackets).toHaveLength(1)
  })

  it('deletes a bracket', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.createBracket>
    act(() => {
      bracket = result.current.createBracket('Test')
    })
    expect(result.current.brackets).toHaveLength(1)

    act(() => {
      result.current.deleteBracket(bracket!.bracketId)
    })
    expect(result.current.brackets).toHaveLength(0)
  })

  it('gets a bracket by ID', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.createBracket>
    act(() => {
      bracket = result.current.createBracket('Test')
    })

    expect(result.current.getBracket(bracket!.bracketId)).toBeTruthy()
    expect(result.current.getBracket('nonexistent')).toBeUndefined()
  })

  it('updates a pick', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.createBracket>
    act(() => {
      bracket = result.current.createBracket('Test')
    })

    act(() => {
      result.current.updatePick(bracket!.bracketId, 'East-R1-G1', 'duke')
    })

    const updated = result.current.getBracket(bracket!.bracketId)
    expect(updated!.picks['East-R1-G1']).toBe('duke')
  })

  it('locks and unlocks a bracket', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.createBracket>
    act(() => {
      bracket = result.current.createBracket('Test')
    })

    act(() => {
      result.current.lockBracket(bracket!.bracketId)
    })
    expect(result.current.getBracket(bracket!.bracketId)!.locked).toBe(true)

    act(() => {
      result.current.unlockBracket(bracket!.bracketId)
    })
    expect(result.current.getBracket(bracket!.bracketId)!.locked).toBe(false)
  })

  it('reads existing data from localStorage on mount', () => {
    // Pre-populate localStorage
    const store = {
      brackets: [
        {
          bracketId: 'abc',
          name: 'Existing',
          createdAt: '2026-03-15T00:00:00Z',
          updatedAt: '2026-03-15T00:00:00Z',
          locked: false,
          picks: { 'East-R1-G1': 'duke' },
        },
      ],
    }
    localStorage.setItem('mmBrackets', JSON.stringify(store))

    const { result } = renderHook(() => useBrackets())
    expect(result.current.brackets).toHaveLength(1)
    expect(result.current.brackets[0].name).toBe('Existing')
    expect(result.current.brackets[0].picks['East-R1-G1']).toBe('duke')
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('mmBrackets', 'not json')
    const { result } = renderHook(() => useBrackets())
    expect(result.current.brackets).toEqual([])
  })
})
