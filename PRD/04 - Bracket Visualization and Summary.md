# Bracket Visualization and Summary PRD

## Task Source
- Source: Freeform description (Epic 4 of 5 from main March Madness Bracket Builder PRD)
- Title: Bracket Visualization and Summary View
- URL: N/A
- Project / Milestone: March Madness Kids Bracket Builder v1
- Last synced: 2026-03-15

## Problem Statement
After completing a bracket (or when viewing a saved bracket), users need to see a full NCAA-style bracket tree showing all their picks. This is the payoff moment — kids see their champion and can browse the full bracket. Without this, completed brackets have no visual summary and there's no way to see the big picture.

## Goals
- Build the Bracket Complete / Summary screen (Screen 4 from main PRD)
- Build the Bracket View screen for returning users (Screen 5 from main PRD)
- Build a custom CSS/SVG bracket tree visualization matching the NCAA bracket format
- Display champion prominently with celebration
- Support locked bracket viewing with "Unlock to Edit" flow

## Non-Goals
- Print styling (Epic 5)
- Score entry or bracket scoring (v2)
- Bracket sharing via URL (v2)
- Mobile-optimized bracket layout (v2)

## Current State (Repository Audit)
- Existing related code (after Epics 1-3):
  - `src/data/bracket.ts` — bracket structure, game resolution, all 63 game IDs
  - `src/hooks/useBrackets.ts` — load brackets, lock/unlock
  - `src/types/index.ts` — all types
  - `src/components/TeamCard.tsx` — can be reused for champion display
  - `src/components/Button.tsx`, `src/components/Layout.tsx` — reusable UI
  - React Router with `/bracket/:id/view` route placeholder
- Gaps identified:
  - No bracket tree visualization component
  - No summary/complete screens
  - No champion celebration UI

## Architecture and Ownership Plan

- App layer:
  - `src/screens/BracketCompleteScreen.tsx` — shown when all 63 picks are just completed (celebratory variant)
  - `src/screens/BracketViewScreen.tsx` — shown when viewing a previously completed bracket from Home (could be same component with a prop, or merged into one)
- Data layer:
  - No changes — all data already available from Epic 1
- Shared/UI library:
  - `src/components/BracketTree.tsx` — the full NCAA-style bracket visualization (custom CSS/SVG)
  - `src/components/BracketSlot.tsx` — individual team slot in the bracket tree (seed + short name + optional tiny mascot)
  - `src/components/ChampionBanner.tsx` — large champion display with celebration header
- Services/integrations:
  - None
- Infrastructure:
  - None

## DRY and Reuse Plan
- Reuse decisions:
  - `TeamCard` from Epic 3 — reused for the large champion display
  - `Button` from Epic 2 — for all action buttons
  - `Layout` from Epic 2 — page wrapper
  - `BracketTree` component will also be reused in Epic 5 for print view
  - Bracket data functions from `src/data/bracket.ts` — resolve all game winners for display
- Refactors to reduce duplication:
  - N/A

## Detailed Implementation Scope

- Step 1: Build BracketSlot component
  - Files: `src/components/BracketSlot.tsx`
  - Acceptance criteria: Compact display of one team in the bracket tree: seed number + short name. Optionally a tiny mascot thumbnail. Winner slots highlighted (e.g., bold or colored background). Loser slots dimmed/grayed. Empty slots for games not yet picked show placeholder.

- Step 2: Build BracketTree component (custom CSS/SVG)
  - Files: `src/components/BracketTree.tsx`, `src/components/BracketTree.css` (or CSS module)
  - Acceptance criteria:
    - 4 regions displayed as quadrants (East/West on left side, South/Midwest on right side — or similar standard layout)
    - Each region shows R1 → R2 → Sweet 16 → Elite 8 progression with connecting lines
    - Final Four in the center connecting the 4 regional winners
    - Championship in the absolute center
    - Connector lines between rounds (SVG lines or CSS borders)
    - Each slot uses BracketSlot component
    - Scrollable/zoomable if needed for smaller screens
    - Works correctly with partial brackets (some slots empty)

- Step 3: Build ChampionBanner component
  - Files: `src/components/ChampionBanner.tsx`
  - Acceptance criteria: Celebratory header text ("🏆 Bracket Complete!"). Large champion TeamCard centered. Team name and seed prominently displayed. Visually distinct and exciting.

- Step 4: Build BracketCompleteScreen
  - Files: `src/screens/BracketCompleteScreen.tsx`
  - Acceptance criteria:
    - ChampionBanner at top
    - Full BracketTree below showing all 63 picks
    - Bracket is locked — picks are read-only
    - "Unlock to Edit" button with confirmation prompt → unlocks bracket and navigates to pick flow
    - "Start Another Bracket" button → navigates to `/new`
    - "Home" button → navigates to `/`
    - "Print Bracket" button (placeholder — wired up in Epic 5)

- Step 5: Build BracketViewScreen (or merge with BracketCompleteScreen)
  - Files: `src/screens/BracketViewScreen.tsx`
  - Acceptance criteria: Same layout as BracketCompleteScreen but entered from Home screen for a previously completed bracket. Shows champion, full bracket tree, and action buttons. Supports unlock-to-edit flow. If bracket is incomplete (user is viewing progress), show partial bracket without champion banner.

## Data and Dependency Changes
- Model/schema/query changes: None
- Package manifest updates: None
- Infrastructure changes: None

## Testing and Validation Plan
- Unit tests:
  - `src/components/BracketSlot.test.tsx`: Renders team info, winner/loser states, empty state
  - `src/components/BracketTree.test.tsx`: Renders correct number of slots (63 games × 2 teams), handles partial brackets
- Integration tests:
  - None
- Manual verification:
  - Complete a bracket → celebration screen shows champion and full bracket tree
  - All 63 games visible in bracket tree with correct matchups and winners
  - Bracket tree lines connect correctly between rounds
  - "Unlock to Edit" → confirmation → navigates to pick flow
  - View a completed bracket from Home → same bracket tree display
  - View an in-progress bracket → partial bracket, no champion banner

## Risks and Mitigations
- Risk: Bracket tree layout is complex and may not render well at all screen sizes
  - Mitigation: Target desktop/tablet (1024px+) for v1. Allow horizontal scroll on smaller screens. Mobile-optimized layout is explicitly v2.
- Risk: SVG connector lines may be tricky to position correctly
  - Mitigation: Can fall back to CSS border-based connectors (left/right borders on slots) which are simpler to implement.

## Open Questions
- None

## Recommended Skills
- None specifically required

## Definition of Done
- [ ] BracketSlot renders team info with winner/loser/empty states
- [ ] BracketTree displays full 4-region NCAA bracket layout
- [ ] Connector lines between rounds render correctly
- [ ] Final Four and Championship shown in center of bracket
- [ ] ChampionBanner shows celebration and champion team
- [ ] BracketCompleteScreen shows all elements with action buttons
- [ ] Lock/unlock flow works: locked by default, unlock with confirmation
- [ ] Partial brackets display correctly (empty slots for unpicked games)
- [ ] Navigation: Home, Start Another, Unlock to Edit all work
