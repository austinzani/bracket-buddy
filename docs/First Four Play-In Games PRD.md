# First Four Play-In Games PRD

## Task Source
- Source: Freeform description
- Title: Support First Four play-in games with dual-team buttons
- URL: N/A
- Project / Milestone: Bracket Buddy
- Last synced: 2026-03-16

## Problem Statement
The NCAA tournament has 68 teams, not 64. Four "First Four" play-in games decide which teams fill certain seed slots before Round 1 begins. Currently, the app hardcodes 64 teams (one per seed per region) and skips play-in games entirely. The four losing play-in teams (Texas, Prairie View A&M, Miami OH, Howard) are missing from the dataset, and users can't pick play-in winners.

The user wants play-in slots to show **two teams side-by-side in a single button** wherever a play-in team appears in the pick flow — effectively a split button that shows both candidates until the play-in game is picked.

## Goals
- Add the 4 missing play-in teams to the dataset (68 total)
- Add 4 play-in games to the bracket (67 total games)
- In the pick flow, play-in games appear first (before Round 1)
- Once a play-in winner is picked, the Round 1 game shows the winner normally
- Bracket tree/print view shows play-in winners in R1 slots (no layout changes)

## Non-Goals
- Perfectly sized images for the split buttons — some visual cramping is acceptable
- Changing the bracket tree/print view to show play-in games (can be a follow-up)
- Supporting arbitrary numbers of play-in games (always exactly 4)

## Current State (Repository Audit)

### Existing related code
- `src/types/index.ts`: `Team` interface has `seed: number` — one team per seed per region. No play-in concept.
- `public/data/teams.json`: 64 teams. 4 entries have `_notes` identifying them as First Four winners:
  - NC State (West, seed 11) vs Texas
  - Lehigh (South, seed 16) vs Prairie View A&M
  - SMU (Midwest, seed 11) vs Miami OH
  - UMBC (Midwest, seed 16) vs Howard
- `src/data/bracket.ts`:
  - `generateBracketGames()` indexes teams by `region + seed` (Map overwrites duplicates — **breaks if two teams share same region+seed**)
  - `SEED_MATCHUPS` is hardcoded for 8 games per region
  - `getGameParticipants()` returns team IDs directly for Round 1 games
  - `getRoundByRoundOrder()` orders games by round number
  - `getBracketProgress()` hardcodes `total: 63`
- `src/components/MatchupView.tsx`: Renders exactly 2 `TeamCard` components. No concept of a "split" team.
- `src/components/TeamCard.tsx`: Renders a single team per card.
- `src/screens/PickFlowScreen.tsx`: Completion check hardcodes `total === 63`.

### Gaps identified
- No `playIn` or `isPlayIn` field on `Team` type
- No way to represent two teams sharing a seed slot
- No play-in game generation
- Missing 4 teams from dataset
- Hardcoded game count (63) in multiple places

## Architecture and Ownership Plan

### Data layer (`src/types/index.ts`, `public/data/teams.json`)
- Add a `playInMatchup` field to `Team` (or mark at the data level) so the app knows which teams are in play-in games
- Add 4 missing teams to `teams.json` with a field linking them to their play-in opponent
- Approach: Add an optional `playInGameId` field to `Team` — if set, this team participates in a play-in game. Two teams sharing the same `playInGameId` are opponents.

### Bracket generation (`src/data/bracket.ts`)
- Generate 4 play-in games (round 0) before Round 1
- For Round 1 games at affected seeds: `sourceA`/`sourceB` should reference the play-in game ID (not a team ID directly) when that seed has a play-in
- `isFirstRound` logic needs updating: some R1 sources are team IDs, others are play-in game IDs
- Update `getBracketProgress` total from 63 to 67
- Update `getRoundByRoundOrder` to put play-in games first

### UI components (`src/components/`)
- No new components needed — play-in games are standard 1v1 matchups rendered with existing `TeamCard` and `MatchupView`
- The bracket tree/print view just shows the play-in winner in the R1 slot (no layout changes)

### Pick flow (`src/screens/PickFlowScreen.tsx`)
- Update completion check from 63 to 67
- Play-in games appear at the start of the pick order

## DRY and Reuse Plan
- Reuse existing `MatchupView` and `TeamCard` unchanged — play-in games are standard 1v1 matchups
- Reuse `getGameParticipants` pattern — extend it to resolve play-in game IDs the same way it resolves Round 2+ game IDs

## Detailed Implementation Scope

### Step 1: Add play-in data to teams.json
- Files: `public/data/teams.json`
- Add 4 new team entries: Texas, Prairie View A&M, Miami OH, Howard
- Add `playInGameId` field to all 8 play-in teams (the 4 existing + 4 new), e.g.:
  - NC State & Texas → `"playInGameId": "PlayIn-G1"`
  - Lehigh & Prairie View A&M → `"playInGameId": "PlayIn-G2"`
  - SMU & Miami OH → `"playInGameId": "PlayIn-G3"`
  - UMBC & Howard → `"playInGameId": "PlayIn-G4"`
- Each pair shares the same `seed` and `region`
- Acceptance criteria: 68 teams in dataset, 8 with `playInGameId` set

### Step 2: Update Team type
- Files: `src/types/index.ts`
- Add `playInGameId?: string` to `Team` interface
- Acceptance criteria: Type compiles, existing code unaffected (field is optional)

### Step 3: Update bracket generation for play-in games
- Files: `src/data/bracket.ts`
- Detect play-in teams: group teams by `playInGameId`
- Generate 4 play-in `Game` entries (round 0, `isFirstRound: true`)
- For R1 games at play-in seeds: set `sourceA`/`sourceB` to the play-in game ID and `isFirstRound: false`
- Fix team indexing: when two teams share the same region+seed, store both and wire them to the play-in game instead of overwriting
- Update `getBracketProgress` total: 67
- Update `getRoundByRoundOrder`: play-in games (round 0) come first
- Acceptance criteria: `generateBracketGames` returns 67 games; play-in game IDs are used as sources in the 4 affected R1 games

### Step 4: Update getGameParticipants for play-in resolution
- Files: `src/data/bracket.ts`
- For R1 games that reference a play-in game ID: look up the play-in winner from `picks`, same as Round 2+ logic
- Return `null` for undecided play-in results (same as undecided later rounds)
- New helper: `getPlayInTeams(playInGameId, teams)` — returns the two teams for a given play-in game
- Acceptance criteria: R1 participants resolve correctly after play-in picks; return null before play-in picks

### Step 5: Update PickFlowScreen completion check
- Files: `src/screens/PickFlowScreen.tsx`
- Change hardcoded `63` to use `getBracketProgress` total (which will now return 67)
- Acceptance criteria: Bracket completes after 67 picks

### Step 6: Update tests
- Files: `src/data/bracket.test.ts`, `src/components/TeamCard.test.tsx`, `src/hooks/useBrackets.test.ts`
- Update game count expectations from 63 to 67
- Add tests for play-in game generation
- Add tests for play-in participant resolution
- Acceptance criteria: All tests pass with 67-game bracket

## Data and Dependency Changes
- Model change: `Team.playInGameId?: string` (additive, non-breaking)
- Data change: 4 new team entries in `teams.json`, 8 entries gain `playInGameId`
- No package/dependency changes
- No infrastructure changes

## Testing and Validation Plan

### Unit tests
- `src/data/bracket.test.ts`: Test 67 games generated; test play-in game sources; test R1 games reference play-in IDs for affected seeds
- No new component tests needed — play-in games reuse existing components

### Manual verification
- Complete a full bracket (67 picks) — play-in games appear first
- Change a play-in pick — verify the downstream R1 game is invalidated
- Verify R1 games show "waiting" state if play-in somehow not yet picked
- Verify print/view still works after completion

## Risks and Mitigations
- **Risk:** Team indexing by region+seed breaks with duplicate seeds
  - Mitigation: Change indexing to store arrays or handle play-in teams separately before R1 generation
- **Risk:** Downstream invalidation may not cascade from play-in → R1 → R2...
  - Mitigation: Play-in games feed into R1 via game ID references, so existing `invalidateDownstreamPicks` should work naturally
- **Risk:** Split buttons may look cramped on small screens
  - Mitigation: User has accepted this trade-off; can iterate on sizing later

## Open Questions (Resolved)
- **Play-in game order:** All 4 play-in games come first in the pick flow (picks 1-4), before any Round 1 games. This ensures R1 matchups are always resolved when the user reaches them.
- **Bracket tree view:** The bracket tree and print view only show the play-in winner in their R1 slot. No layout changes needed — keeps the existing bracket visualization simple.
- **Unpicked play-in dependencies:** Handled naturally by ordering — play-ins are always first, so R1 games won't be reached before their play-in is decided. If a user navigates back, the existing "waiting for earlier picks" message covers it.

## Recommended Skills
- None required beyond standard React/TypeScript development

## Definition of Done
- [ ] 68 teams in dataset with `playInGameId` on 8 play-in teams
- [ ] 67 games generated (4 play-in + 63 main bracket)
- [ ] Play-in games appear first in pick flow
- [ ] R1 games with undecided play-ins show existing "waiting" state
- [ ] Full bracket completion works with 67 picks
- [ ] Downstream invalidation works from play-in → R1 → later rounds
- [ ] All tests pass
- [ ] Manual verification of full pick flow
