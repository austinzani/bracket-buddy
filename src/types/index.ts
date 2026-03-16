export type Region = 'East' | 'West' | 'South' | 'Midwest'

export type Round = 0 | 1 | 2 | 3 | 4 // R0=PlayIn, R1=Round of 64, R2=Round of 32, R3=Sweet 16, R4=Elite 8

export interface Team {
  id: string
  name: string
  shortName: string
  seed: number
  region: Region
  primaryColor: string
  secondaryColor: string
  jerseyImage: string // Image of the teams Basketball jersey even if someone is wearing it
  mascotImage: string // Drawing of the mascot or school logo
  mascotCostumeImage: string // Image of the school student who dresses up as the mascot for games or the pet representative
  playInGameId?: string // If set, this team is in a First Four play-in game
}

/**
 * Game ID conventions:
 * - Play-in games: "PlayIn-G1" through "PlayIn-G4"
 * - Regional rounds: "{Region}-R{round}-G{game}" e.g. "East-R1-G1"
 * - Final Four: "FinalFour-G1", "FinalFour-G2"
 * - Championship: "Championship"
 */
export type GameId = string

export interface Bracket {
  bracketId: string
  name: string
  createdAt: string
  updatedAt: string
  picks: Record<GameId, string> // gameId -> winning team id
}

export interface BracketsStore {
  brackets: Bracket[]
}

export interface AppConfig {
  tournamentYear: number
  appName: string
  showSeedInCard: boolean
  pickOrder: 'round-by-round' | 'region-by-region'
}

/** Represents a single game in the bracket structure */
export interface Game {
  gameId: GameId
  round: number // 0-6 (0=PlayIn, 1=R64, 2=R32, 3=Sweet16, 4=Elite8, 5=FinalFour, 6=Championship)
  region: Region | null // null for Final Four and Championship
  /** For round 1, these are team IDs. For later rounds, these are prerequisite game IDs. */
  sourceA: string
  sourceB: string
  /** Whether sourceA/sourceB are team IDs (true) or game IDs (false) */
  isFirstRound: boolean
}
