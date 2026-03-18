import { useMemo, useRef, useLayoutEffect, useState, useCallback, type CSSProperties } from 'react'
import type { Team, GameId, Game, Region } from '../types'
import { generateBracketGames } from '../data/bracket'
import { getTeamById } from '../data/teams'
import { BracketSlot } from './BracketSlot'

interface BracketTreeProps {
  teams: Team[]
  picks: Record<GameId, string>
}

/* ─── Layout constants ─── */
const SLOT_GAP = 4
const CONNECTOR_GAP = 32 // horizontal space for SVG connector lines

/* ─── Line styling ─── */
const LINE_COLOR = '#aaa'
const LINE_W = 1.5

/**
 * SVG connector that measures actual DOM positions of the top input badge,
 * bottom input badge, and output badge, then draws a "]" or "[" shaped path.
 */
function computePath(
  container: HTMLDivElement,
  top: HTMLDivElement,
  bottom: HTMLDivElement,
  output: HTMLDivElement,
  reverse?: boolean,
) {
  const cR = container.getBoundingClientRect()
  const tR = top.getBoundingClientRect()
  const bR = bottom.getBoundingClientRect()
  const oR = output.getBoundingClientRect()

  const tCenterY = tR.top - cR.top + tR.height / 2
  const bCenterY = bR.top - cR.top + bR.height / 2
  const midY = (tCenterY + bCenterY) / 2

  let inputX: number
  let outputX: number

  if (reverse) {
    inputX = tR.left - cR.left
    outputX = oR.right - cR.left
  } else {
    inputX = tR.right - cR.left
    outputX = oR.left - cR.left
  }

  const midX = (inputX + outputX) / 2

  return [
    `M ${inputX} ${tCenterY} H ${midX}`,
    `V ${bCenterY}`,
    `H ${inputX}`,
    `M ${midX} ${midY} H ${outputX}`,
  ].join(' ')
}

function SvgConnector({
  topRef,
  bottomRef,
  outputRef,
  reverse,
}: {
  topRef: React.RefObject<HTMLDivElement | null>
  bottomRef: React.RefObject<HTMLDivElement | null>
  outputRef: React.RefObject<HTMLDivElement | null>
  reverse?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pathD, setPathD] = useState('')
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const c = containerRef.current
    const t = topRef.current
    const b = bottomRef.current
    const o = outputRef.current
    if (!c || !t || !b || !o) return

    const d = computePath(c, t, b, o, reverse)
    const cR = c.getBoundingClientRect()

    setPathD(d)
    setSize({ w: cR.width, h: cR.height })
  }, [topRef, bottomRef, outputRef, reverse])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  // Re-measure when anything resizes (including .print-mode class toggle)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    if (containerRef.current) ro.observe(containerRef.current)
    for (const ref of [topRef, bottomRef, outputRef]) {
      if (ref.current) ro.observe(ref.current)
    }
    return () => ro.disconnect()
  }, [measure, topRef, bottomRef, outputRef])

  return (
    <div
      ref={containerRef}
      data-connector=""
      style={{
        width: CONNECTOR_GAP,
        minWidth: CONNECTOR_GAP,
        alignSelf: 'stretch',
        position: 'relative',
      }}
    >
      <svg
        width={size.w || '100%'}
        height={size.h || '100%'}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <path
          d={pathD}
          stroke={LINE_COLOR}
          strokeWidth={LINE_W}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

/**
 * Recursive bracket game component.
 * Every game renders: [two inputs] → [SVG connector] → [winner slot]
 *
 * The `outputRef` prop allows a parent game to attach its input ref
 * to this game's winner badge, so the parent's connector measures
 * from the correct position regardless of subtree depth.
 */
function BracketGame({
  gameId,
  games,
  picks,
  teams,
  reverse,
  outputRef,
}: {
  gameId: GameId
  games: Map<GameId, Game>
  picks: Record<GameId, string>
  teams: Team[]
  reverse?: boolean
  outputRef?: React.RefObject<HTMLDivElement | null> // ref from parent to attach to this game's winner
}) {
  const game = games.get(gameId)

  // Refs for this game's connector measurement
  const topInputRef = useRef<HTMLDivElement>(null)
  const bottomInputRef = useRef<HTMLDivElement>(null)
  const localOutputRef = useRef<HTMLDivElement>(null)

  // The output ref is either the one passed from the parent or our local one
  const winnerRef = outputRef ?? localOutputRef

  if (!game) return null

  const winnerId = picks[gameId]
  const winnerTeam = winnerId ? getTeamById(teams, winnerId) : undefined

  // Build the two input elements
  let inputA: React.ReactNode
  let inputB: React.ReactNode

  // For the bracket tree, R1 games are always leaf nodes.
  // Resolve each source to a team: direct team ID or play-in winner from picks.
  const isLeaf = game.round === 1 || game.isFirstRound

  if (isLeaf) {
    const resolveTeam = (source: string) => {
      // If source is a play-in game ID, look up the winner
      if (games.has(source)) {
        const winner = picks[source]
        return winner ? getTeamById(teams, winner) : undefined
      }
      return source ? getTeamById(teams, source) : undefined
    }
    const resolveTeamId = (source: string): string | undefined => {
      if (games.has(source)) return picks[source]
      return source || undefined
    }

    const teamA = resolveTeam(game.sourceA)
    const teamB = resolveTeam(game.sourceB)
    const teamAId = resolveTeamId(game.sourceA)
    const teamBId = resolveTeamId(game.sourceB)

    inputA = (
      <BracketSlot
        ref={topInputRef}
        team={teamA ?? null}
        isWinner={winnerId !== undefined && winnerId === teamAId}
        compact
      />
    )
    inputB = (
      <BracketSlot
        ref={bottomInputRef}
        team={teamB ?? null}
        isWinner={winnerId !== undefined && winnerId === teamBId}
        compact
      />
    )
  } else {
    // R2+: recursive subtrees. Pass our input ref as the child's outputRef
    // so the child's winner badge becomes our connector's input measurement point.
    inputA = (
      <BracketGame
        gameId={game.sourceA}
        games={games}
        picks={picks}
        teams={teams}
        reverse={reverse}
        outputRef={topInputRef}
      />
    )
    inputB = (
      <BracketGame
        gameId={game.sourceB}
        games={games}
        picks={picks}
        teams={teams}
        reverse={reverse}
        outputRef={bottomInputRef}
      />
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: reverse ? 'row-reverse' : 'row',
      alignItems: 'center',
    }}>
      {/* Two inputs stacked vertically */}
      <div data-bracket-inputs="" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: SLOT_GAP,
      }}>
        {inputA}
        {inputB}
      </div>

      {/* SVG connector lines */}
      <SvgConnector
        topRef={topInputRef}
        bottomRef={bottomInputRef}
        outputRef={winnerRef}
        reverse={reverse}
      />

      {/* Winner slot */}
      <BracketSlot
        ref={winnerRef}
        team={winnerTeam ?? null}
        isWinner={winnerId !== undefined}
        compact
      />
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
  picks,
  teams,
}: {
  picks: Record<GameId, string>
  teams: Team[]
}) {
  // Visual order is top: East vs South (FinalFour-G2), bottom: Midwest vs West (FinalFour-G1).
  const topFinalFourWinnerId = picks['FinalFour-G2']
  const topFinalFourWinner = topFinalFourWinnerId ? getTeamById(teams, topFinalFourWinnerId) : undefined
  const bottomFinalFourWinnerId = picks['FinalFour-G1']
  const bottomFinalFourWinner = bottomFinalFourWinnerId ? getTeamById(teams, bottomFinalFourWinnerId) : undefined

  const winnerId = picks['Championship']
  const winner = winnerId ? getTeamById(teams, winnerId) : undefined

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
      {/* Final Four (East vs South) winner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div data-bracket-label="" style={centerLabelStyle}>Final Four</div>
        <BracketSlot
          team={topFinalFourWinner ?? null}
          isWinner={topFinalFourWinnerId !== undefined}
          compact
        />
      </div>

      {/* Championship */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div data-bracket-label="" style={centerLabelStyle}>Championship</div>
        <ChampionSlot winner={winner} />
      </div>

      {/* Final Four (Midwest vs West) winner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div data-bracket-label="" style={centerLabelStyle}>Final Four</div>
        <BracketSlot
          team={bottomFinalFourWinner ?? null}
          isWinner={bottomFinalFourWinnerId !== undefined}
          compact
        />
      </div>
    </div>
  )
}

function ChampionSlot({ winner }: { winner?: Team }) {
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

const centerLabelStyle: CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 1,
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
        {/* Left side: East on top, South below */}
        <div data-bracket-side="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RegionBracket region="East" games={games} picks={picks} teams={teams} />
          <RegionBracket region="South" games={games} picks={picks} teams={teams} />
        </div>

        {/* Center: Final Four + Championship */}
        <CenterColumn picks={picks} teams={teams} />

        {/* Right side: West on top, Midwest below (mirrored) */}
        <div data-bracket-side="" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RegionBracket region="West" games={games} picks={picks} teams={teams} reverse />
          <RegionBracket region="Midwest" games={games} picks={picks} teams={teams} reverse />
        </div>
      </div>
    </div>
  )
}
