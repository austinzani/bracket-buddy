# Print View and Polish PRD

## Task Source
- Source: Freeform description (Epic 5 of 5 from main March Madness Bracket Builder PRD)
- Title: Print View and Final Polish
- URL: N/A
- Project / Milestone: March Madness Kids Bracket Builder v1
- Last synced: 2026-03-15

## Problem Statement
Families want to print completed brackets to hang on the fridge or bring to watch parties. The app also needs a final polish pass for accessibility, error states, loading states, and deployment readiness. Without this epic, the app is functional but not shippable.

## Goals
- Implement print stylesheet that renders a clean, single-page bracket
- Wire up "Print Bracket" button on summary screens
- Implement loading and error states across all screens
- Ensure accessibility standards are met (keyboard nav, focus states, aria labels, color-independent state indication)
- Verify static site deployment works (Vite build → deployable output)
- Create a basic README with deployment instructions

## Non-Goals
- Mobile-first responsive layout (v2)
- Sound effects (v2)
- Score entry mode (v2)
- Share via URL (v2)

## Current State (Repository Audit)
- Existing related code (after Epics 1-4):
  - `src/components/BracketTree.tsx` — full bracket visualization (reused for print)
  - `src/screens/BracketCompleteScreen.tsx` — has "Print Bracket" button placeholder
  - `src/screens/BracketViewScreen.tsx` — also needs print button
  - `src/hooks/useTeams.ts` — has loading/error states
  - `src/hooks/useBrackets.ts` — has try/catch for localStorage
  - All components from previous epics
- Gaps identified:
  - No print stylesheet
  - No `@media print` CSS
  - Print button not wired up
  - Loading/error states may not be fully implemented in all screens
  - Accessibility audit not yet done
  - No README

## Architecture and Ownership Plan

- App layer:
  - `src/screens/BracketCompleteScreen.tsx` — wire up print button
  - `src/screens/BracketViewScreen.tsx` — wire up print button
  - All screens — add loading/error state handling where missing
- Data layer:
  - No changes
- Shared/UI library:
  - `src/styles/print.css` — `@media print` stylesheet
  - `src/components/ErrorState.tsx` — reusable error display component
  - `src/components/LoadingState.tsx` — reusable loading display component
- Services/integrations:
  - None
- Infrastructure:
  - `README.md` — deployment instructions
  - Verify `npm run build` output is deployable

## DRY and Reuse Plan
- Reuse decisions:
  - `BracketTree` component renders in both screen and print contexts — no separate print component needed
  - `ErrorState` and `LoadingState` components reused across all screens
- Refactors to reduce duplication:
  - Audit all screens for duplicated loading/error handling patterns and extract to shared components

## Detailed Implementation Scope

- Step 1: Create print stylesheet
  - Files: `src/styles/print.css`
  - Acceptance criteria:
    - `@media print` rules hide all navigation, buttons, and chrome
    - Only the bracket tree and bracket name are visible
    - White background with black text
    - Each team slot shows seed + short name (images optional — omit if they don't fit cleanly)
    - Targets single landscape page
    - Footer: "Created with [appName from config] · [date]"

- Step 2: Wire up Print button
  - Files: `src/screens/BracketCompleteScreen.tsx`, `src/screens/BracketViewScreen.tsx`
  - Acceptance criteria: "Print Bracket" button calls `window.print()`. Print preview shows clean bracket layout per Step 1 specs.

- Step 3: Build ErrorState and LoadingState components
  - Files: `src/components/ErrorState.tsx`, `src/components/LoadingState.tsx`
  - Acceptance criteria:
    - `LoadingState`: Kid-friendly loading indicator (e.g., bouncing basketball animation or spinner with fun text)
    - `ErrorState`: Friendly error message with retry action. Handles: teams.json load failure, localStorage unavailable, bracket not found.

- Step 4: Add loading/error states to all screens
  - Files: `src/screens/HomeScreen.tsx`, `src/screens/PickFlowScreen.tsx`, `src/screens/BracketCompleteScreen.tsx`, `src/screens/BracketViewScreen.tsx`
  - Acceptance criteria: Every screen that loads data shows LoadingState while loading and ErrorState on failure. No blank screens or unhandled errors.

- Step 5: Accessibility audit and fixes
  - Files: Various component files
  - Acceptance criteria:
    - All interactive elements keyboard-navigable with visible focus states
    - Team cards have `aria-label="Pick [Team Name]"` (verify from Epic 3)
    - Color alone does not convey pick state (shape/icon used in addition to color)
    - Confirmation dialogs are accessible
    - Page titles/headings provide screen reader context
    - Focus management on screen transitions (focus moves to main content)

- Step 6: Deployment verification and README
  - Files: `README.md`
  - Acceptance criteria:
    - `npm run build` produces a working static site in `dist/`
    - README documents: project overview, how to run locally (`npm install && npm run dev`), how to build (`npm run build`), how to deploy (Netlify/Vercel/GitHub Pages), how to populate `teams.json` with real tournament data
    - Test deploy to at least one static host or verify with `npx serve dist`

## Data and Dependency Changes
- Model/schema/query changes: None
- Package manifest updates: None expected
- Infrastructure changes: None

## Testing and Validation Plan
- Unit tests:
  - `src/components/ErrorState.test.tsx`: Renders error message and retry button
  - `src/components/LoadingState.test.tsx`: Renders loading indicator
- Integration tests:
  - None
- Manual verification:
  - Print a completed bracket → single landscape page, clean layout, no chrome
  - Disconnect from network → teams.json fails → error state shown with retry
  - Clear localStorage → app shows empty state gracefully
  - Tab through entire pick flow with keyboard only → all elements reachable
  - Screen reader announces team names and pick actions
  - `npm run build` → `npx serve dist` → full app works from built output

## Risks and Mitigations
- Risk: Print layout varies significantly across browsers
  - Mitigation: Test in Chrome and Safari (most common). Use simple CSS for print — avoid complex layouts that differ between engines.
- Risk: Bracket tree may not fit on a single printed page
  - Mitigation: Use smaller font sizes in print stylesheet. Accept that very detailed brackets may span two pages — optimize for "good enough" on landscape letter/A4.

## Open Questions
- None

## Recommended Skills
- None specifically required

## Definition of Done
- [ ] Print stylesheet hides chrome and shows clean bracket on one landscape page
- [ ] Print button works on both summary screens
- [ ] Loading states shown while data loads on every screen
- [ ] Error states shown for all failure modes (network, localStorage, missing bracket)
- [ ] All interactive elements keyboard accessible
- [ ] aria-labels on team cards and important actions
- [ ] Color is not the sole indicator of state
- [ ] `npm run build` produces deployable static site
- [ ] README with setup, build, deploy, and data population instructions
