# Home Screen and Bracket Management PRD

## Task Source
- Source: Freeform description (Epic 2 of 5 from main March Madness Bracket Builder PRD)
- Title: Home Screen and Bracket Management
- URL: N/A
- Project / Milestone: March Madness Kids Bracket Builder v1
- Last synced: 2026-03-15

## Problem Statement
Users need a way to see their saved brackets, create new ones, continue in-progress brackets, and delete old ones. This is the entry point of the app and the navigation hub. Without it, there's no way to manage multiple brackets per device.

## Goals
- Build the Home / Bracket List screen (Screen 1 from main PRD)
- Build the Create Bracket screen (Screen 2 from main PRD)
- Implement routing between screens
- Handle empty state when no brackets exist
- Kid-friendly, large touch targets, fun visual design

## Non-Goals
- The pick flow itself (Epic 3)
- Bracket visualization / summary view (Epic 4)
- Print functionality (Epic 5)
- Responsive mobile layout (desktop/tablet primary for v1)

## Current State (Repository Audit)
- Existing related code (after Epic 1):
  - `src/hooks/useBrackets.ts` — CRUD operations for brackets (create, delete, load)
  - `src/hooks/useTeams.ts` — team data loading
  - `src/types/index.ts` — all data types
  - `src/App.tsx` — app shell with placeholder routes
- Gaps identified:
  - No UI components exist yet
  - No routing configured
  - No visual design system (colors, typography, spacing)

## Architecture and Ownership Plan

- App layer:
  - `src/App.tsx` — configure React Router with routes: `/` (home), `/new` (create), `/bracket/:id` (pick flow, placeholder), `/bracket/:id/view` (summary, placeholder)
  - `src/screens/HomeScreen.tsx` — bracket list screen
  - `src/screens/CreateBracketScreen.tsx` — name entry screen
- Data layer:
  - Reuse `useBrackets` hook from Epic 1 — no changes needed
- Shared/UI library:
  - `src/components/BracketCard.tsx` — card showing a saved bracket (name, date, progress, actions)
  - `src/components/Button.tsx` — reusable kid-friendly button component (large, colorful)
  - `src/components/Layout.tsx` — shared page layout wrapper (max-width, centering, padding)
- Services/integrations:
  - None
- Infrastructure:
  - None — React Router already included in Epic 1 dependencies

## DRY and Reuse Plan
- Reuse decisions:
  - `useBrackets` hook from Epic 1 — all data operations
  - `Button` component will be reused across all screens
  - `Layout` component will be reused across all screens
- Refactors to reduce duplication:
  - N/A — first UI components being created

## Detailed Implementation Scope

- Step 1: Set up app-wide styling and layout
  - Files: `src/index.css` (or CSS module), `src/components/Layout.tsx`
  - Acceptance criteria: Base font, colors, and spacing defined. Layout component provides consistent page structure. Kid-friendly aesthetic (rounded corners, playful colors, large text).

- Step 2: Create reusable Button component
  - Files: `src/components/Button.tsx`
  - Acceptance criteria: Large, touch-friendly button with hover/focus states. Supports primary (prominent) and secondary variants. Keyboard accessible with visible focus ring.

- Step 3: Build Home Screen
  - Files: `src/screens/HomeScreen.tsx`, `src/components/BracketCard.tsx`
  - Acceptance criteria: Displays app title/wordmark. "Start New Bracket" button prominent at top. Lists saved brackets showing: name, created date, progress ("X of 63 picks"), Continue/View button, Delete button with confirmation dialog. Empty state shown when no brackets exist with friendly message and CTA.

- Step 4: Build Create Bracket Screen
  - Files: `src/screens/CreateBracketScreen.tsx`
  - Acceptance criteria: Large friendly prompt ("Name your bracket"). Large text input (touch-friendly). "Let's Go!" button creates bracket via `useBrackets.createBracket(name)` and navigates to pick flow route. Back button returns to Home. Input validation (non-empty name).

- Step 5: Configure routing
  - Files: `src/App.tsx`
  - Acceptance criteria: `/` renders HomeScreen. `/new` renders CreateBracketScreen. `/bracket/:id` and `/bracket/:id/view` render placeholder components. Navigation between screens works. Browser back/forward works correctly.

## Data and Dependency Changes
- Model/schema/query changes: None — uses existing data layer from Epic 1
- Package manifest updates: None — react-router-dom already included
- Infrastructure changes: None

## Testing and Validation Plan
- Unit tests:
  - `src/components/BracketCard.test.tsx`: Renders bracket info correctly, delete triggers confirmation
  - `src/components/Button.test.tsx`: Renders variants, handles click
- Integration tests:
  - None required for this epic
- Manual verification:
  - App loads to Home screen with empty state
  - Create a bracket → navigates to pick flow placeholder
  - Return to Home → bracket appears in list with "0 of 63" progress
  - Delete bracket with confirmation → removed from list
  - Multiple brackets can coexist

## Risks and Mitigations
- Risk: Visual design may not feel "kid-friendly" enough
  - Mitigation: Use large rounded elements, bright colors, playful typography. Can iterate on visual polish in Epic 5.

## Open Questions
- None

## Recommended Skills
- None specifically required

## Definition of Done
- [ ] Home screen displays saved brackets with all required info
- [ ] Empty state renders when no brackets exist
- [ ] Create bracket flow works end-to-end (name → create → navigate)
- [ ] Delete bracket with confirmation works
- [ ] Routing between Home and Create screens works
- [ ] All interactive elements keyboard-accessible with visible focus states
- [ ] Reusable Button and Layout components created
