import { useState, useEffect, useCallback } from 'react'
import type { Bracket, BracketsStore, GameId, Game } from '../types'
import { invalidateDownstreamPicks } from '../data/bracket'

const STORAGE_KEY = 'mmBrackets'

function readStore(): BracketsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { brackets: [] }
    const parsed = JSON.parse(raw) as BracketsStore
    if (!Array.isArray(parsed.brackets)) return { brackets: [] }
    return parsed
  } catch {
    return { brackets: [] }
  }
}

function writeStore(store: BracketsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (e) {
    console.error('Failed to write to localStorage:', e)
  }
}

export function useBrackets() {
  const [brackets, setBrackets] = useState<Bracket[]>(() => readStore().brackets)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Sync from localStorage on mount (handles other tabs)
  useEffect(() => {
    try {
      const store = readStore()
      setBrackets(store.brackets)
    } catch {
      setStorageError('Unable to access saved brackets. localStorage may be disabled.')
    }
  }, [])

  const persist = useCallback((updated: Bracket[]) => {
    setBrackets(updated)
    try {
      writeStore({ brackets: updated })
    } catch {
      setStorageError('Failed to save. Storage may be full.')
    }
  }, [])

  const createBracket = useCallback(
    (name: string): Bracket => {
      const bracket: Bracket = {
        bracketId: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        locked: false,
        picks: {},
      }
      persist([...brackets, bracket])
      return bracket
    },
    [brackets, persist],
  )

  const deleteBracket = useCallback(
    (bracketId: string): void => {
      persist(brackets.filter((b) => b.bracketId !== bracketId))
    },
    [brackets, persist],
  )

  const getBracket = useCallback(
    (bracketId: string): Bracket | undefined => {
      return brackets.find((b) => b.bracketId === bracketId)
    },
    [brackets],
  )

  const updatePick = useCallback(
    (
      bracketId: string,
      gameId: GameId,
      winnerId: string,
      games?: Map<GameId, Game>,
    ): GameId[] => {
      let invalidated: GameId[] = []

      const updated = brackets.map((b) => {
        if (b.bracketId !== bracketId) return b

        let newPicks = { ...b.picks }
        const previousWinner = newPicks[gameId]

        // If changing a pick and we have the games map, invalidate downstream
        if (previousWinner && previousWinner !== winnerId && games) {
          const result = invalidateDownstreamPicks(gameId, previousWinner, games, newPicks)
          newPicks = result.updatedPicks
          invalidated = result.invalidated
        }

        newPicks[gameId] = winnerId

        return {
          ...b,
          picks: newPicks,
          updatedAt: new Date().toISOString(),
        }
      })

      persist(updated)
      return invalidated
    },
    [brackets, persist],
  )

  const lockBracket = useCallback(
    (bracketId: string): void => {
      const updated = brackets.map((b) =>
        b.bracketId === bracketId ? { ...b, locked: true, updatedAt: new Date().toISOString() } : b,
      )
      persist(updated)
    },
    [brackets, persist],
  )

  const unlockBracket = useCallback(
    (bracketId: string): void => {
      const updated = brackets.map((b) =>
        b.bracketId === bracketId ? { ...b, locked: false, updatedAt: new Date().toISOString() } : b,
      )
      persist(updated)
    },
    [brackets, persist],
  )

  return {
    brackets,
    storageError,
    createBracket,
    deleteBracket,
    getBracket,
    updatePick,
    lockBracket,
    unlockBracket,
  }
}
