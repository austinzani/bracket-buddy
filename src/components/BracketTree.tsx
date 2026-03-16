import { useMemo, type CSSProperties } from 'react'
import type { Team, GameId, Game, Region } from '../types'
import { generateBracketGames } from '../data/bracket'
import { getTeamById } from '../data/teams'
import { BracketSlot } from './BracketSlot'

interface BracketTreeProps {
  teams: Team[]
  picks: Record<GameId, string>
}

/* ─── Slot dimensions (used for connector math) ─── */
const SLOT_H = 28
const SLOT_GAP = 4 // vertical gap between two slots in a matchup
const ROUND_GAP = 24 // horizontal gap between rounds (where connector lines live)
const CONNECTOR_W = 16 // width of the bracket connector arm

/* ─── Colors ─── */
const LINE_COLOR = 'var(--color-border, #ccc)'
const LINE_W = 1.5

/**
 * Recursive component: renders one game as a traditional bracket.
 * - For R1 games: two BracketSlots stacked vertically
 * - For later rounds: two child BracketGame subtrees connected by bracket lines,
 *   with the winner BracketSlot at the output.
 */
function BracketGame({
  gameId,
  games,
  picks,
  teams,
  reverse,
}: {
  gameId: GameId
  games: Map<GameId, Game>
  picks: Record<GameId, string>
  teams: Team[]
  reverse?: boolean // right-side regions flow right-to-left
}) {
  const game = games.get(gameId)
  if (!game) return null

  const winnerId = picks[gameId]

  if (game.isFirstRound) {
    // R1: just two team slots stacked
    const teamA = game.sourceA ? getTeamById(teams, game.sourceA) : undefined
    const teamB = game.sourceB ? getTeamById(teams, game.sourceB) : undefined
    return (
      <div data-matchup="" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: SLOT_GAP,
      }}>
        <BracketSlot
          team={teamA ?? null}
          isWinner={winnerId !== undefined && winnerId === game.sourceA}
          compact
        />
        <BracketSlot
          team={teamB ?? null}
          isWinner={winnerId !== undefined && winnerId === game.sourceB}
          compact
        />
      </div>
    )
  }

  // R2+: recurse into source games, draw connector, show winner slot
  const winnerTeam = winnerId ? getTeamById(teams, winnerId) : undefined

  return (
    <div style={{
      display: 'flex',
      flexDirection: reverse ? 'row-reverse' : 'row',
      alignItems: 'center',
    }}>
      {/* Two source subtrees stacked vertically */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: SLOT_GAP,
      }}>
        <BracketGame
          gameId={game.sourceA}
          games={games}
          picks={picks}
          teams={teams}
          reverse={reverse}
        />
        <BracketGame
          gameId={game.sourceB}
          games={games}
          picks={picks}
          teams={teams}
          reverse={reverse}
        />
      </div>

      {/* Bracket connector lines */}
      <BracketConnector reverse={reverse} />

      {/* Winner slot at the output */}
      <BracketSlot
        team={winnerTeam ?? null}
        isWinner={winnerId !== undefined}
        compact
      />
    </div>
  )
}

/**
 * The "]" or "[" shaped connector.
 * Two horizontal arms (top/bottom) that meet at a vertical bar,
 * then a single horizontal arm extending out to the winner slot.
 */
function BracketConnector({ reverse }: { reverse?: boolean }) {
  const borderSide = reverse ? 'Left' : 'Right'
  const otherSide = reverse ? 'Right' : 'Left'

  return (
    <div style={{
      display: 'flex',
      flexDirection: reverse ? 'row-reverse' : 'row',
      alignItems: 'center',
      width: ROUND_GAP,
      minWidth: ROUND_GAP,
      alignSelf: 'stretch',
    }}>
      {/* Two-arm bracket: top arm + bottom arm with vertical connector */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignSelf: 'stretch',
      }}>
        {/* Top arm */}
        <div style={{
          flex: 1,
          [`border${borderSide}` as string]: `${LINE_W}px solid ${LINE_COLOR}`,
          borderBottom: `${LINE_W}px solid ${LINE_COLOR}`,
          minHeight: SLOT_H / 2,
        }} />
        {/* Bottom arm */}
        <div style={{
          flex: 1,
          [`border${borderSide}` as string]: `${LINE_W}px solid ${LINE_COLOR}`,
          borderTop: `${LINE_W}px solid ${LINE_COLOR}`,
          minHeight: SLOT_H / 2,
        }} />
      </div>
      {/* Horizontal line out to the winner slot */}
      <div style={{
        width: CONNECTOR_W / 2,
        minWidth: CONNECTOR_W / 2,
        height: 0,
        borderTop: `${LINE_W}px solid ${LINE_COLOR}`,
      }} />
    </div>
  )
}

/**
 * Renders a full region bracket recursively from its R4 root game.
 */
function RegionBracket({
  region,
  games,
  picks,
  teams,
  reverse,
}: {
  region: Region
  games: Map<GameId, Game>
  picks: Record<GameId, string>
  teams: Team[]
  reverse?: boolean
}) {
  const rootGameId = `${region}-R4-G1`

  return (
    <div data-region="" style={{ display: 'flex', flexDirection: 'column' }}>
      <div data-bracket-label="" style={regionLabelStyle}>{region}</div>
      <BracketGame
        gameId={rootGameId}
        games={games}
        picks={picks}
        teams={teams}
        reverse={reverse}
      />
    </div>
  )
}

/** Final Four + Championship center column */
function CenterColumn({
  games,
  picks,
  teams,
}: {
  games: Map<GameId, Game>
  picks: Record<GameId, string>
  teams: Team[]
}) {
  const championId = picks['Championship']
  const champion = championId ? getTeamById(teams, championId) : undefined

  // Final Four G1 participants
  const ff1WinnerId = picks['FinalFour-G1']
  const ff1Winner = ff1WinnerId ? getTeamById(teams, ff1WinnerId) : undefined
  const ff2WinnerId = picks['FinalFour-G2']
  const ff2Winner = ff2WinnerId ? getTeamById(teams, ff2WinnerId) : undefined

  return (
    <div data-center-column="" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: '0 8px',
      minWidth: 160,
    }}>
      {/* Final Four G1 winner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div data-bracket-label="" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Final Four
        </div>
        <BracketSlot
          team={ff1Winner ?? null}
          isWinner={ff1WinnerId !== undefined}
          compact
        />
      </div>

      {/* Championship */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div data-bracket-label="" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Championship
        </div>
        <ChampionSlot gameId="Championship" picks={picks} teams={teams} />
      </div>

      {/* Final Four G2 winner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div data-bracket-label="" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Final Four
        </div>
        <BracketSlot
          team={ff2Winner ?? null}
          isWinner={ff2WinnerId !== undefined}
          compact
        />
      </div>
    </div>
  )
}

function ChampionSlot({
  gameId,
  picks,
  teams,
}: {
  gameId: GameId
  picks: Record<GameId, string>
  teams: Team[]
}) {
  const winnerId = picks[gameId]
  const winner = winnerId ? getTeamById(teams, winnerId) : undefined

  if (!winner) {
    return (
      <div data-champion-slot="" style={{
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        color: '#bbb',
        fontSize: '0.8rem',
        fontWeight: 700,
        textAlign: 'center',
        border: '2px dashed var(--color-border)',
      }}>
        Champion TBD
      </div>
    )
  }

  return (
    <div data-champion-slot="" style={{
      padding: '8px 16px',
      borderRadius: 8,
      backgroundColor: winner.primaryColor,
      color: winner.secondaryColor || '#ffffff',
      fontSize: '0.9rem',
      fontWeight: 800,
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      border: `2px solid ${winner.primaryColor}`,
    }}>
      🏆 {winner.seed} {winner.shortName}
    </div>
  )
}

const regionLabelStyle: CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  marginBottom: 4,
}

export function BracketTree({ teams, picks }: BracketTreeProps) {
  const games = useMemo(() => generateBracketGames(teams), [teams])

  if (games.size === 0) return null

  return (
    <div data-bracket-tree="" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div data-bracket-container="" style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '0.5rem 0',
        gap: 4,
        minWidth: 'min-content',
      }}>
        {/* Left side: East on top, West below — flow left-to-right */}
        <div data-bracket-side="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RegionBracket region="East" games={games} picks={picks} teams={teams} />
          <RegionBracket region="West" games={games} picks={picks} teams={teams} />
        </div>

        {/* Center: Final Four + Championship */}
        <CenterColumn games={games} picks={picks} teams={teams} />

        {/* Right side: South on top, Midwest below — flow right-to-left (mirrored) */}
        <div data-bracket-side="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RegionBracket region="South" games={games} picks={picks} teams={teams} reverse />
          <RegionBracket region="Midwest" games={games} picks={picks} teams={teams} reverse />
        </div>
      </div>
    </div>
  )
}
