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

  it('updates multiple picks on same bracket', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.createBracket>
    act(() => {
      bracket = result.current.createBracket('Test')
    })

    act(() => {
      result.current.updatePick(bracket!.bracketId, 'East-R1-G1', 'duke')
    })
    act(() => {
      result.current.updatePick(bracket!.bracketId, 'East-R1-G2', 'ohio-state')
    })

    const updated = result.current.getBracket(bracket!.bracketId)
    expect(updated!.picks['East-R1-G1']).toBe('duke')
    expect(updated!.picks['East-R1-G2']).toBe('ohio-state')
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

  it('migrates invalid final four picks and clears championship when no longer valid', () => {
    const store = {
      brackets: [
        {
          bracketId: 'abc',
          name: 'Legacy',
          createdAt: '2026-03-15T00:00:00Z',
          updatedAt: '2026-03-15T00:00:00Z',
          picks: {
            'East-R4-G1': 'east-1',
            'South-R4-G1': 'south-1',
            'West-R4-G1': 'west-1',
            'Midwest-R4-G1': 'midwest-1',
            // Legacy final four mapping pick (invalid in current flow)
            'FinalFour-G1': 'east-1',
            // Still valid in current flow (East vs South)
            'FinalFour-G2': 'south-1',
            // Should be cleared because one finalist becomes unknown after migration
            Championship: 'south-1',
          },
        },
      ],
    }
    localStorage.setItem('mmBrackets', JSON.stringify(store))

    const { result } = renderHook(() => useBrackets())
    const picks = result.current.brackets[0].picks

    expect(picks['FinalFour-G1']).toBeUndefined()
    expect(picks['FinalFour-G2']).toBe('south-1')
    expect(picks.Championship).toBeUndefined()
  })

  it('preserves championship pick when it is still valid after migration', () => {
    const store = {
      brackets: [
        {
          bracketId: 'abc',
          name: 'Current',
          createdAt: '2026-03-15T00:00:00Z',
          updatedAt: '2026-03-15T00:00:00Z',
          picks: {
            'East-R4-G1': 'east-1',
            'South-R4-G1': 'south-1',
            'West-R4-G1': 'west-1',
            'Midwest-R4-G1': 'midwest-1',
            'FinalFour-G1': 'west-1',
            'FinalFour-G2': 'east-1',
            Championship: 'east-1',
          },
        },
      ],
    }
    localStorage.setItem('mmBrackets', JSON.stringify(store))

    const { result } = renderHook(() => useBrackets())
    const picks = result.current.brackets[0].picks

    expect(picks['FinalFour-G1']).toBe('west-1')
    expect(picks['FinalFour-G2']).toBe('east-1')
    expect(picks.Championship).toBe('east-1')
  })

  it('migrates imported legacy picks to the current final four flow', () => {
    const { result } = renderHook(() => useBrackets())

    let bracket: ReturnType<typeof result.current.importBracket>
    act(() => {
      bracket = result.current.importBracket('Imported', {
        'East-R4-G1': 'east-1',
        'South-R4-G1': 'south-1',
        'West-R4-G1': 'west-1',
        'Midwest-R4-G1': 'midwest-1',
        'FinalFour-G1': 'east-1',
        'FinalFour-G2': 'south-1',
        Championship: 'south-1',
      })
    })

    expect(bracket!.picks['FinalFour-G1']).toBeUndefined()
    expect(bracket!.picks['FinalFour-G2']).toBe('south-1')
    expect(bracket!.picks.Championship).toBeUndefined()
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('mmBrackets', 'not json')
    const { result } = renderHook(() => useBrackets())
    expect(result.current.brackets).toEqual([])
  })
})
