# First Four Dual-Team Slot Display PRD

## Task Source
- Source: Freeform description
- Title: Show both play-in teams side-by-side in bracket slots before winner is picked
- URL: N/A
- Project / Milestone: Bracket Buddy
- Last synced: 2026-03-16

## Problem Statement

When a Round 1 game has a play-in source (e.g., `sourceA: "PlayIn-G1"`), the BracketSlot shows "TBD" until the play-in winner is picked. Similarly, in the pick flow's MatchupView, an R1 game with an unpicked play-in shows a "waiting" screen. The user wants both play-in teams to be visible side-by-side — as two mini-buttons/slots — wherever a play-in slot appears, so users can see who the possible teams are before the play-in is decided.

## Goals
- In the **BracketTree** view: when a slot's source is a play-in game and no winner is picked yet, show both play-in teams as two compact slots stacked or side-by-side instead of "TBD"
- In the **PickFlowScreen**: when an R1 game has an unresolved play-in source, show both play-in teams as a paired button instead of the "waiting" screen — the user still picks between the two resolved teams (or in the case where only the play-in side is unpicked, show the known team on one side and the two play-in teams as a paired element on the other)
- When the play-in winner IS picked, display the single winner as normal (current behavior)

## Non-Goals
- Redesigning the TeamCard component for aesthetic perfection with dual teams (user explicitly said spacing weirdness is OK)
- Making play-in games themselves look different in the pick flow (they already work fine as 2-team matchups)
- Changing the data model or bracket generation logic

## Current State (Repository Audit)

### Existing related code:
- `src/components/BracketSlot.tsx`: Renders a single team or "TBD". Takes `team: Team | null`. No support for showing two teams.
- `src/components/BracketTree.tsx`: Lines 185-219 handle leaf node rendering. When `game.sourceA` is a play-in game ID, `resolveTeam()` returns `undefined` if no winner picked yet, causing BracketSlot to show "TBD".
- `src/screens/PickFlowScreen.tsx`: Lines 191-209 show "Waiting for earlier round picks" when `teamA` or `teamB` is undefined (unpicked play-in source).
- `src/components/MatchupView.tsx`: Renders two TeamCards. Currently requires exactly one Team per side.
- `src/components/TeamCard.tsx`: Renders a single team card with mascot images, seed badge, and team name bar.
- `src/data/bracket.ts`: `generateBracketGames()` creates play-in games (round 0) and R1 games that reference play-in game IDs as sources. `getGameParticipants()` resolves sources to team IDs.

### Gaps identified:
- BracketSlot has no concept of "two possible teams" — it takes `Team | null`
- BracketTree leaf rendering doesn't look up play-in team pairs when winner is unpicked
- PickFlowScreen blocks with a waiting message instead of showing available play-in teams
- No helper exists to look up both teams in a play-in game from just the play-in game ID

## Architecture and Ownership Plan

### Data layer (`src/data/bracket.ts`):
- Add a helper function `getPlayInTeams(playInGameId: GameId, games: Map, teams: Team[]): [Team, Team] | null` that returns both teams from a play-in game, for use in UI components.

### UI components:
- **`src/components/BracketSlot.tsx`**: Add a new prop variant to support showing two teams. Either:
  - Add `playInTeams?: [Team, Team]` prop — when set and `team` is null, render two mini-slots side-by-side
  - Or create a `DualBracketSlot` wrapper that renders two BracketSlots in a row at half width
- **`src/components/BracketTree.tsx`**: In the leaf node rendering (lines 185-219), when a source is a play-in game ID and has no winner, pass both play-in teams to BracketSlot's dual-team mode instead of rendering "TBD"
- **`src/screens/PickFlowScreen.tsx`**: Remove the "waiting" state for unpicked play-in sources. Instead, resolve the play-in teams and pass them to MatchupView (or a variant that shows paired teams on one side)
- **`src/components/MatchupView.tsx`**: Potentially support a "dual team" on one side — showing two mini TeamCards stacked where the play-in hasn't been decided

### Shared/UI library:
- Reuse existing `BracketSlot` styling for the dual variant (same colors, font sizes, just narrower)
- Reuse existing `TeamCard` for pick flow dual display

## DRY and Reuse Plan
- Reuse decisions:
  - `BracketSlot` → extend with optional `playInTeams` prop rather than creating a new component
  - `TeamCard` → reuse as-is for pick flow, just render two smaller ones side-by-side
- Refactors to reduce duplication:
  - Extract play-in team lookup into `getPlayInTeams()` helper in `bracket.ts` so both BracketTree and PickFlowScreen use the same resolution logic

## Detailed Implementation Scope

### Step 1: Add `getPlayInTeams` helper to bracket.ts
- Files: `src/data/bracket.ts`
- Add function: `getPlayInTeams(source: string, games: Map<GameId, Game>, teams: Team[]): [Team, Team] | null`
  - If `source` is a game ID in the games map AND that game is round 0 (play-in), return both teams from `sourceA` and `sourceB`
  - Otherwise return null
- Acceptance criteria: Function returns the two play-in teams for a play-in game ID, null for non-play-in sources

### Step 2: Update BracketSlot to support dual-team display
- Files: `src/components/BracketSlot.tsx`
- Add optional `playInTeams?: [Team, Team]` prop
- When `team` is null and `playInTeams` is provided, render two mini team badges side-by-side within the same slot dimensions:
  - Each shows seed number and abbreviated team name
  - Use a "/" or "vs" separator
  - Same height as normal slot (28px), split width between the two teams
  - Each team colored with its `primaryColor` for the seed badge
- Acceptance criteria: BracketSlot renders two team names side-by-side when `playInTeams` is set and `team` is null; renders normally when `team` is set (winner picked)

### Step 3: Update BracketTree leaf rendering to pass play-in teams
- Files: `src/components/BracketTree.tsx`
- In the leaf node section (lines 185-219), when `resolveTeam(source)` returns undefined and `games.has(source)`:
  - Look up both teams from the play-in game using `getPlayInTeams`
  - Pass them as `playInTeams` prop to BracketSlot
- Acceptance criteria: Bracket tree shows both play-in teams in R1 slots before play-in winner is decided; shows single winner after play-in is picked

### Step 4: Update PickFlowScreen to handle unpicked play-in sources
- Files: `src/screens/PickFlowScreen.tsx`
- Remove the "waiting for earlier round picks" block (lines 191-209) for the specific case where the missing team is due to an unpicked play-in
- Instead, when one side of an R1 game is a play-in game ID with no winner:
  - Show both play-in teams as two smaller buttons side-by-side on that side of the matchup
  - When the user picks one of the play-in teams: first record the play-in pick, then record the R1 pick
  - OR simpler approach: auto-skip to the play-in game first if it's unpicked, then come back to the R1 game
- Acceptance criteria: User never sees "waiting" screen for play-in-sourced R1 games; they either see the play-in game first (game ordering already handles this) or see both teams displayed

### Step 5: Verify game ordering handles play-in-before-R1
- Files: `src/data/bracket.ts` (read-only verification)
- Confirm `getRoundByRoundOrder()` already orders play-in games (round 0) before R1 games
- If so, the PickFlowScreen "waiting" state should never actually trigger for play-in sources because the user picks play-ins first
- If confirmed, Step 4 simplifies to just keeping the waiting state as a safety fallback but it should never appear in practice
- Acceptance criteria: Verified that play-in games come before their dependent R1 games in pick order

## Data and Dependency Changes
- Model/schema/query changes: none
- Package manifest updates: none
- Infrastructure changes: none

## Testing and Validation Plan
- Unit tests:
  - `src/data/bracket.test.ts`: Add tests for `getPlayInTeams()` helper
  - `src/components/BracketSlot.test.tsx` (if exists): Test dual-team rendering
- Manual verification:
  - Create a new bracket and verify play-in games appear first in pick flow
  - After picking play-in winners, verify R1 games show the winner correctly
  - In bracket tree view, verify unpicked play-in slots show both team names
  - After picking play-in winners, verify bracket tree shows single winner in those slots
  - Print bracket with unpicked play-ins and verify dual-team slots render correctly

## Risks and Mitigations
- Risk: Dual-team slot may be too cramped at 130-170px width
  - Mitigation: Use very abbreviated names (shortName), drop mascot images in dual mode, user OK with spacing weirdness
- Risk: Pick flow might already handle play-in ordering correctly, making Step 4 unnecessary
  - Mitigation: Step 5 verifies this; if game ordering is correct, Step 4 becomes a no-op

## Open Questions
- Should the dual-team BracketSlot show team colors (each half in its team's primary color) or remain neutral gray?
- In the bracket tree, should the dual-team slot be wider than a normal slot, or keep the same width and compress the text?
- If game ordering already ensures play-ins are picked before R1, should we still update the PickFlowScreen "waiting" state, or leave it as a safety fallback?

## Recommended Skills
- None specifically required; standard React/TypeScript patterns

## Definition of Done
- [ ] `getPlayInTeams()` helper implemented and tested
- [ ] BracketSlot supports dual-team display mode
- [ ] BracketTree passes play-in teams to slots for unpicked play-ins
- [ ] Pick flow handles play-in-sourced games without "waiting" screen (or verified unnecessary)
- [ ] All existing tests pass
- [ ] Manual verification of bracket tree and pick flow with play-in teams
