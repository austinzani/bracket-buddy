import { useMemo, type CSSProperties } from 'react'
import type { Team, GameId, Game, Region } from '../types'
import { generateBracketGames, getGameParticipants } from '../data/bracket'
import { getTeamById } from '../data/teams'
import { BracketSlot } from './BracketSlot'

interface BracketTreeProps {
  teams: Team[]
  picks: Record<GameId, string>
}

/** Render a single matchup: two slots stacked with a connector */
function Matchup({
  gameId,
  games,
  picks,
  teams,
  alignRight,
}: {
  gameId: GameId
  games: Map<GameId, Game>
  picks: Record<GameId, string>
  teams: Team[]
  alignRight?: boolean
}) {
  const [teamAId, teamBId] = getGameParticipants(gameId, games, picks)
  const teamA = teamAId ? getTeamById(teams, teamAId) : undefined
  const teamB = teamBId ? getTeamById(teams, teamBId) : undefined
  const winnerId = picks[gameId]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      alignItems: alignRight ? 'flex-end' : 'flex-start',
    }}>
      <BracketSlot
        team={teamA ?? null}
        isWinner={winnerId !== undefined && winnerId === teamAId}
        compact
      />
      <BracketSlot
        team={teamB ?? null}
        isWinner={winnerId !== undefined && winnerId === teamBId}
        compact
      />
    </div>
  )
}

/** Render a full region column (R1 through R4) */
function RegionColumn({
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
  const rounds = [1, 2, 3, 4]
  const gameCounts = [8, 4, 2, 1]
  const displayRounds = reverse ? [...rounds].reverse() : rounds

  return (
    <div style={{
      display: 'flex',
      flexDirection: reverse ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    }}>
      {displayRounds.map((round) => {
        const count = gameCounts[round - 1]
        const gameIds = Array.from({ length: count }, (_, i) => `${region}-R${round}-G${i + 1}`)
        // Spacing increases each round to visually align brackets
        const gap = round === 1 ? 8 : round === 2 ? 24 : round === 3 ? 56 : 120

        return (
          <div
            key={round}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              gap,
              minHeight: round === 1 ? undefined : 0,
              flex: round === 1 ? '0 0 auto' : '1 1 0',
            }}
          >
            {gameIds.map((gid) => (
              <Matchup
                key={gid}
                gameId={gid}
                games={games}
                picks={picks}
                teams={teams}
                alignRight={reverse}
              />
            ))}
          </div>
        )
      })}
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
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: '0 8px',
      minWidth: 160,
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
        Final Four
      </div>
      <Matchup gameId="FinalFour-G1" games={games} picks={picks} teams={teams} />
      <div style={{
        padding: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Championship
        </div>
        <ChampionSlot gameId="Championship" picks={picks} teams={teams} />
      </div>
      <Matchup gameId="FinalFour-G2" games={games} picks={picks} teams={teams} />
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
      <div style={{
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
    <div style={{
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

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  overflowX: 'auto',
  padding: '1rem 0',
  gap: 4,
  minWidth: 0,
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
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={containerStyle}>
        {/* Left side: East and West (left-to-right flow) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={regionLabelStyle}>East</div>
            <RegionColumn region="East" games={games} picks={picks} teams={teams} />
          </div>
          <div>
            <div style={regionLabelStyle}>West</div>
            <RegionColumn region="West" games={games} picks={picks} teams={teams} />
          </div>
        </div>

        {/* Center: Final Four + Championship */}
        <CenterColumn games={games} picks={picks} teams={teams} />

        {/* Right side: South and Midwest (right-to-left flow, mirrored) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={regionLabelStyle}>South</div>
            <RegionColumn region="South" games={games} picks={picks} teams={teams} reverse />
          </div>
          <div>
            <div style={regionLabelStyle}>Midwest</div>
            <RegionColumn region="Midwest" games={games} picks={picks} teams={teams} reverse />
          </div>
        </div>
      </div>
    </div>
  )
}
