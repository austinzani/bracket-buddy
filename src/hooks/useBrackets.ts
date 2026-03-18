import { useState, useEffect, useCallback } from 'react'
import type { Bracket, BracketsStore, GameId, Game } from '../types'
import { invalidateDownstreamPicks } from '../data/bracket'

const STORAGE_KEY = 'mmBrackets'
const FINAL_FOUR_SOURCES = {
  'FinalFour-G1': ['Midwest-R4-G1', 'West-R4-G1'],
  'FinalFour-G2': ['East-R4-G1', 'South-R4-G1'],
} as const

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

/**
 * Ensure saved Final Four / Championship picks still match the current bracket flow.
 * This allows us to migrate old saved brackets when semifinal sources change.
 */
function migrateLateRoundPicks(picks: Record<GameId, string>): { picks: Record<GameId, string>; changed: boolean } {
  const migrated = { ...picks }
  let changed = false

  for (const [finalFourGameId, [sourceAId, sourceBId]] of Object.entries(FINAL_FOUR_SOURCES)) {
    const selectedWinner = migrated[finalFourGameId]
    if (!selectedWinner) continue

    const sourceAWinner = migrated[sourceAId]
    const sourceBWinner = migrated[sourceBId]
    const isValid =
      !!sourceAWinner &&
      !!sourceBWinner &&
      (selectedWinner === sourceAWinner || selectedWinner === sourceBWinner)

    if (!isValid) {
      delete migrated[finalFourGameId]
      changed = true
    }
  }

  const championshipWinner = migrated.Championship
  if (championshipWinner) {
    const finalistA = migrated['FinalFour-G1']
    const finalistB = migrated['FinalFour-G2']
    const isChampionshipPickValid =
      !!finalistA &&
      !!finalistB &&
      (championshipWinner === finalistA || championshipWinner === finalistB)

    if (!isChampionshipPickValid) {
      delete migrated.Championship
      changed = true
    }
  }

  return { picks: migrated, changed }
}

function migrateStore(store: BracketsStore): { store: BracketsStore; changed: boolean } {
  let changed = false

  const migratedBrackets = store.brackets.map((bracket) => {
    const result = migrateLateRoundPicks(bracket.picks)
    if (!result.changed) return bracket

    changed = true
    return {
      ...bracket,
      picks: result.picks,
    }
  })

  return {
    store: changed ? { brackets: migratedBrackets } : store,
    changed,
  }
}

export function useBrackets() {
  const [brackets, setBrackets] = useState<Bracket[]>(() => migrateStore(readStore()).store.brackets)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Sync from localStorage on mount (handles other tabs)
  useEffect(() => {
    try {
      const migrationResult = migrateStore(readStore())
      setBrackets(migrationResult.store.brackets)
      if (migrationResult.changed) {
        writeStore(migrationResult.store)
      }
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
        picks: {},
      }
      persist([...brackets, bracket])
      return bracket
    },
    [brackets, persist],
  )

  const importBracket = useCallback(
    (name: string, picks: Record<GameId, string>): Bracket => {
      const migrationResult = migrateLateRoundPicks(picks)
      const bracket: Bracket = {
        bracketId: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        picks: migrationResult.picks,
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

  return {
    brackets,
    storageError,
    createBracket,
    importBracket,
    deleteBracket,
    getBracket,
    updatePick,
  }
}
