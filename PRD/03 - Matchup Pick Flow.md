# Matchup Pick Flow PRD

## Task Source
- Source: Freeform description (Epic 3 of 5 from main March Madness Bracket Builder PRD)
- Title: Matchup Pick Flow (Core Experience)
- URL: N/A
- Project / Milestone: March Madness Kids Bracket Builder v1
- Last synced: 2026-03-15

## Problem Statement
The pick flow is the core experience of the app — where kids choose tournament winners one matchup at a time by tapping on team cards showing mascots, jerseys, and team colors. Without this, the app has no primary functionality. The flow must be simple enough for young children while walking through all 63 games in the correct round-by-round order.

## Goals
- Build the matchup-by-matchup pick flow (Screen 3 from main PRD)
- Build the Team Card component with mascot/jersey images and color-based fallback
- Implement round-by-round pick ordering across all regions
- Support going back to change a previous pick (with downstream pick invalidation)
- Auto-advance to next game on pick selection
- Navigate to bracket complete screen when all 63 picks are made

## Non-Goals
- Bracket visualization / summary view (Epic 4)
- Print functionality (Epic 5)
- Sound effects (v2)
- Mobile-first layout (desktop/tablet primary)

## Current State (Repository Audit)
- Existing related code (after Epics 1-2):
  - `src/data/bracket.ts` — bracket structure generation, `getGameParticipants()`, `getBracketProgress()`, round-by-round ordering
  - `src/hooks/useBrackets.ts` — `updatePick(bracketId, gameId, winnerId)`, `lockBracket()`
  - `src/hooks/useTeams.ts` — team data with loading/error states
  - `src/types/index.ts` — all data types
  - `src/components/Button.tsx` — reusable button
  - `src/components/Layout.tsx` — page layout wrapper
  - React Router configured with `/bracket/:id` route
- Gaps identified:
  - No Team Card component
  - No pick flow screen
  - No image loading with fallback logic
  - No pick navigation (back/forward through games)

## Architecture and Ownership Plan

- App layer:
  - `src/screens/PickFlowScreen.tsx` — orchestrates the pick flow: tracks current game index, resolves participants, handles pick selection and navigation
- Data layer:
  - `src/data/bracket.ts` — may need minor additions: `getNextUnpickedGame(picks, gameOrder)` to find where to resume, `invalidateDownstreamPicks(gameId, picks)` to clear dependent picks when a user changes a previous selection
- Shared/UI library:
  - `src/components/TeamCard.tsx` — the central visual component: team colors, mascot image, jersey image, seed badge, hover/selected states, image fallback to color-only
  - `src/components/MatchupView.tsx` — two TeamCards side-by-side with "VS" divider
  - `src/components/ProgressBar.tsx` — shows current round, region, and game count (e.g., "East — Round 1 | Game 4 of 32")
- Services/integrations:
  - None
- Infrastructure:
  - None

## DRY and Reuse Plan
- Reuse decisions:
  - `src/data/bracket.ts` — all bracket logic lives here, pick flow screen only calls these functions
  - `src/components/Button.tsx` — reuse for back button and any navigation controls
  - `src/components/Layout.tsx` — page wrapper
  - `TeamCard` component will also be reused in Epic 4 (bracket visualization) for the champion display
- Refactors to reduce duplication:
  - N/A

## Detailed Implementation Scope

- Step 1: Build TeamCard component
  - Files: `src/components/TeamCard.tsx`
  - Acceptance criteria:
    - Card background = team's `primaryColor`
    - Mascot image centered, ~60% of card height
    - Jersey image smaller, bottom-left or overlapping
    - Team `shortName` in bold using `secondaryColor` or high-contrast fallback
    - Seed badge in top-left corner (e.g., "#1")
    - Hover state: card lifts with drop shadow
    - Selected state: prominent ring/glow + checkmark overlay
    - **Image fallback**: if mascot/jersey image fails to load (404 or missing), show color-only card with team name and seed prominently displayed. No broken image icons.
    - Lazy-load images with colored placeholder while loading
    - `aria-label="Pick [Team Name]"` for accessibility
    - Keyboard navigable with visible focus state

- Step 2: Build MatchupView component
  - Files: `src/components/MatchupView.tsx`
  - Acceptance criteria: Renders two TeamCards side-by-side with "VS" text divider between them. Cards are large enough for easy viewing on tablet/desktop. Clicking a card triggers `onPick(teamId)`.

- Step 3: Build ProgressBar component
  - Files: `src/components/ProgressBar.tsx`
  - Acceptance criteria: Shows current round name + region (e.g., "East — Round 1"). Shows bracket name. Shows progress (e.g., "Game 4 of 32"). Updates as user advances through games.

- Step 4: Build PickFlowScreen
  - Files: `src/screens/PickFlowScreen.tsx`
  - Acceptance criteria:
    - Loads bracket by ID from route params
    - Resolves current game's two participants using `getGameParticipants()`
    - Displays MatchupView with the two teams
    - On pick: calls `updatePick()`, auto-advances to next game in round-by-round order
    - Back button to revisit previous pick
    - If changing a previous pick, invalidate all downstream picks that depended on the changed team (with visual confirmation)
    - When all 63 picks are made, auto-lock bracket and navigate to summary/complete screen
    - If returning to an in-progress bracket, resume at the first unpicked game
    - Handle edge case: if a team for the current game hasn't been determined yet (missing prerequisite pick), this shouldn't happen with round-by-round ordering, but handle gracefully

- Step 5: Add downstream pick invalidation to bracket logic
  - Files: `src/data/bracket.ts`
  - Acceptance criteria: When a user changes a pick in an earlier round, all later-round picks that included the now-eliminated team are cleared. Returns the list of invalidated game IDs for UI feedback.

## Data and Dependency Changes
- Model/schema/query changes: None — uses existing Bracket type with `picks` map
- Package manifest updates: None
- Infrastructure changes: None

## Testing and Validation Plan
- Unit tests:
  - `src/data/bracket.test.ts`: Test downstream pick invalidation logic — changing a R1 pick should clear R2+ picks involving that team
  - `src/components/TeamCard.test.tsx`: Renders team info, handles image error fallback, shows selected state
- Integration tests:
  - None
- Manual verification:
  - Start a new bracket → pick flow begins at first Round 1 game
  - Pick a team → auto-advances to next game
  - Go back and change a pick → downstream picks cleared
  - Complete all 63 picks → auto-navigates to summary screen
  - Leave mid-bracket, return → resumes at correct game
  - Remove mascot image from a team → card shows color-only fallback

## Risks and Mitigations
- Risk: Image loading performance with 64 teams' worth of mascot + jersey images
  - Mitigation: Lazy-load only the current matchup's images. Color placeholder shown while loading.
- Risk: Downstream pick invalidation could confuse young users
  - Mitigation: Show a clear message when picks are invalidated ("Changing this pick will reset X later picks. Are you sure?")

## Open Questions
- None

## Recommended Skills
- None specifically required

## Definition of Done
- [ ] TeamCard renders with team colors, images, seed badge, and name
- [ ] TeamCard handles missing images gracefully (color-only fallback)
- [ ] TeamCard has hover, selected, and focus states
- [ ] MatchupView shows two cards with VS divider
- [ ] PickFlowScreen walks through all 63 games in round-by-round order
- [ ] Picking auto-advances to next game
- [ ] Back navigation allows changing previous picks
- [ ] Downstream pick invalidation works correctly
- [ ] Completing all picks auto-locks bracket and navigates to summary
- [ ] Resuming an in-progress bracket starts at the correct game
- [ ] All interactive elements are keyboard accessible with aria-labels
