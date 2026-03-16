# Project Scaffolding and Data Layer PRD

## Task Source
- Source: Freeform description (Epic 1 of 5 from main March Madness Bracket Builder PRD)
- Title: Project Scaffolding and Data Layer
- URL: N/A
- Project / Milestone: March Madness Kids Bracket Builder v1
- Last synced: 2026-03-15

## Problem Statement
The project has no code yet. We need a fully scaffolded React + Vite application with the data layer (team definitions, bracket state management, localStorage persistence) in place before any UI can be built. This is the foundation epic that all other epics depend on.

## Goals
- Scaffold a React + Vite project deployable as a static site
- Define TypeScript types for Team, Bracket, and Game ID conventions
- Implement the `teams.json` data loading pipeline with error handling
- Implement localStorage persistence (read/write/delete brackets)
- Implement bracket state management (create, update picks, lock/unlock, delete)
- Generate the tournament bracket structure from team data (matchup tree)

## Non-Goals
- Any UI screens or visual components (handled in later epics)
- Print styling
- Image loading/fallback logic (handled with the Team Card component in Epic 3)
- Bracket visualization component

## Current State (Repository Audit)
- Existing related code:
  - None — greenfield project, empty repository
- Gaps identified:
  - No project scaffolding exists
  - No data types or state management
  - No localStorage persistence layer

## Architecture and Ownership Plan

- App layer:
  - `src/App.tsx` — top-level app shell with React Router (placeholder routes for future screens)
  - `src/main.tsx` — Vite entry point
- Data layer:
  - `src/types/index.ts` — TypeScript interfaces: `Team`, `Bracket`, `BracketPick`, `GameId`, `Region`, `Round`
  - `src/data/teams.ts` — fetch and parse `/public/data/teams.json`, validate shape
  - `src/data/bracket.ts` — pure functions: generate bracket structure from teams, determine next game participants based on picks, compute progress
  - `src/hooks/useBrackets.ts` — React hook wrapping localStorage CRUD: `loadBrackets`, `saveBracket`, `deleteBracket`, `createBracket`, `updatePick`, `lockBracket`, `unlockBracket`
  - `src/hooks/useTeams.ts` — React hook to load teams.json on mount with loading/error states
- Shared/UI library:
  - None in this epic
- Services/integrations:
  - None
- Infrastructure:
  - `vite.config.ts` — Vite config for static site output
  - `tsconfig.json` — TypeScript config
  - `package.json` — project manifest with React, Vite, TypeScript
  - `public/data/teams.json` — placeholder with a few sample teams for development
  - `public/data/config.json` — app configuration (tournamentYear, appName, pickOrder)
  - `index.html` — Vite HTML entry

## DRY and Reuse Plan
- Reuse decisions:
  - Use `crypto.randomUUID()` for bracket IDs (built-in, no dependency needed)
  - All bracket logic (tree generation, matchup resolution) in pure functions in `src/data/bracket.ts` — reusable by any component
- Refactors to reduce duplication:
  - N/A — greenfield

## Detailed Implementation Scope

- Step 1: Scaffold React + Vite + TypeScript project
  - Files: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
  - Acceptance criteria: `npm run dev` starts a dev server; `npm run build` produces a static `dist/` folder

- Step 2: Define TypeScript types
  - Files: `src/types/index.ts`
  - Acceptance criteria: Types exported for `Team`, `Bracket`, `Region`, `Round`, `GameId`. Bracket includes `locked` boolean field. Game ID format matches PRD convention (`{Region}-R{round}-G{game}`, `FinalFour-G1/G2`, `Championship`).

- Step 3: Create sample teams.json and config.json
  - Files: `public/data/teams.json`, `public/data/config.json`
  - Acceptance criteria: `teams.json` contains at least 8 sample teams (enough for one region) with all required fields. `config.json` contains `tournamentYear`, `appName`, `showSeedInCard`, `pickOrder`.

- Step 4: Implement team data loading
  - Files: `src/data/teams.ts`, `src/hooks/useTeams.ts`
  - Acceptance criteria: `useTeams()` hook returns `{ teams, loading, error }`. Handles fetch failure gracefully. Teams grouped by region are accessible.

- Step 5: Implement bracket structure generation
  - Files: `src/data/bracket.ts`
  - Acceptance criteria: Given 64 teams, generates all 63 game IDs with correct matchups. `getGameParticipants(gameId, picks, teams)` returns the two teams for any game based on current picks. `getBracketProgress(picks)` returns pick count out of 63. Round-by-round pick ordering function returns games in correct sequence.

- Step 6: Implement localStorage persistence and bracket hooks
  - Files: `src/hooks/useBrackets.ts`
  - Acceptance criteria: `useBrackets()` hook provides `brackets`, `createBracket(name)`, `updatePick(bracketId, gameId, winnerId)`, `deleteBracket(bracketId)`, `lockBracket(bracketId)`, `unlockBracket(bracketId)`. Data persists across page reloads. Wrapped in try/catch with fallback if localStorage is unavailable.

## Data and Dependency Changes
- Model/schema/query changes:
  - localStorage key `mmBrackets` stores `{ brackets: Bracket[] }`
  - Bracket shape as defined in main PRD with `locked` field
- Package manifest updates:
  - `react`, `react-dom`, `react-router-dom`, `typescript`, `vite`, `@vitejs/plugin-react`
- Infrastructure changes: None

## Testing and Validation Plan
- Unit tests:
  - `src/data/bracket.test.ts`: Test bracket generation (correct game count, correct matchups by seed), pick resolution, progress calculation, round-by-round ordering
  - `src/data/teams.test.ts`: Test team parsing and validation
- Integration tests:
  - `src/hooks/useBrackets.test.ts`: Test localStorage read/write cycle, create/delete/lock/unlock flows
- Manual verification:
  - Dev server starts and renders placeholder app
  - Build produces deployable static output
  - localStorage persists data across page reloads (verify in browser DevTools)

## Risks and Mitigations
- Risk: localStorage unavailable (private browsing, storage full)
  - Mitigation: try/catch wrapper, graceful error state surfaced to UI
- Risk: teams.json schema mismatch
  - Mitigation: Runtime validation in team loader with descriptive error messages

## Open Questions
- None — all resolved in main PRD

## Recommended Skills
- None specifically required for this epic

## Definition of Done
- [ ] React + Vite project scaffolded and builds successfully
- [ ] All TypeScript types defined and exported
- [ ] Sample teams.json and config.json in place
- [ ] Team data loading with error handling
- [ ] Bracket structure generation with correct matchups
- [ ] localStorage CRUD operations working
- [ ] Bracket lock/unlock implemented
- [ ] Unit tests passing for bracket logic
