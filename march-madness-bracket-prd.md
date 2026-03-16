# PRD: March Madness Kids Bracket Builder

**Version:** 1.0  
**Status:** Ready  
**Target audience:** Children (primary), parents and family (secondary)  
**Deployment:** Static web app — no backend required

---

## 1. Overview

A visual, kid-friendly March Madness bracket builder that lets children pick tournament winners based on team mascots, jerseys, and colors rather than stats or scores. Multiple brackets can be saved per device using browser `localStorage`. The app guides users matchup-by-matchup through the full 64-team bracket, supports printing a completed bracket, and is deployable as a static site (no server needed).

---

## 2. Goals

- Make bracket-picking accessible and fun for kids who don't know college basketball
- Walk users through one matchup at a time so the interface is never overwhelming
- Persist brackets locally on the device across sessions
- Allow families to print a finished bracket
- Be shareable: deployable to Netlify, Vercel, or GitHub Pages with zero backend

### Out of Scope (v1)
- User accounts or cloud sync
- Real-time score ingestion (score entry is manual)
- Head-to-head bracket comparison between users
- Mobile-first responsive layout (desktop/tablet primary)

---

## 3. Tournament Structure

March Madness follows a fixed 64-team single-elimination structure (First Four games excluded for simplicity in v1).

```
64 teams → 32 teams → 16 teams → 8 teams → 4 teams → 2 teams → Champion
Round 1    Round 2   Sweet 16   Elite 8   Final 4   Champ.
```

Teams are divided into **4 regions** of 16 teams each:

| Region | Seeds |
|--------|-------|
| East   | 1–16  |
| West   | 1–16  |
| South  | 1–16  |
| Midwest| 1–16  |

First-round matchups are always seeded: **1 vs 16, 2 vs 15, 3 vs 14, 4 vs 13, 5 vs 12, 6 vs 11, 7 vs 10, 8 vs 9**

The Final Four takes the winner of each region's Elite 8. Championship is Final Four game 1 winner vs. Final Four game 2 winner.

---

## 4. Data Structures

### 4.1 Team

Defined in a static `teams.json` file that the operator populates once the field is announced.

```json
{
  "id": "duke",
  "name": "Duke Blue Devils",
  "shortName": "Duke",
  "seed": 1,
  "region": "East",
  "primaryColor": "#003087",
  "secondaryColor": "#FFFFFF",
  "jerseyImage": "/assets/jerseys/duke.png",
  "mascotImage": "/assets/mascots/duke.png"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | URL-safe unique key, e.g. `"kansas"` |
| `name` | string | Full name: `"Kansas Jayhawks"` |
| `shortName` | string | Display name for tight layouts: `"Kansas"` |
| `seed` | number | 1–16 |
| `region` | string | `"East"`, `"West"`, `"South"`, or `"Midwest"` |
| `primaryColor` | string | Hex color — used as card background |
| `secondaryColor` | string | Hex — used for text contrast on card |
| `jerseyImage` | string | Relative or absolute URL to jersey image |
| `mascotImage` | string | Relative or absolute URL to mascot image |

**Full `teams.json` shape:**

```json
[
  { "id": "duke", "name": "Duke Blue Devils", ... },
  { "id": "unc",  "name": "UNC Tar Heels", ... },
  ...
]
```

### 4.2 Bracket

A bracket is one user's full set of picks, stored as a flat map of `gameId → winnerId`. This is intentionally simple — the bracket tree can always be reconstructed from this map plus the seeding rules.

```json
{
  "bracketId": "a1b2c3d4",
  "name": "Emma's Bracket 🏀",
  "createdAt": "2026-03-16T10:30:00Z",
  "updatedAt": "2026-03-16T11:15:00Z",
  "locked": false,
  "picks": {
    "East-R1-G1":  "duke",
    "East-R1-G2":  "georgia-tech",
    "East-R1-G3":  "kentucky",
    "East-R2-G1":  "duke",
    ...
    "FinalFour-G1": "duke",
    "FinalFour-G2": "kansas",
    "Championship": "duke"
  }
}
```

**Game ID convention:**

| Round | Format | Example |
|---|---|---|
| Round 1–4 (regional) | `{Region}-R{round}-G{game}` | `East-R1-G1`, `West-R3-G2` |
| Final Four | `FinalFour-G1`, `FinalFour-G2` | — |
| Championship | `Championship` | — |

Round numbers within a region: R1 = Round of 64, R2 = Round of 32, R3 = Sweet 16, R4 = Elite 8.

### 4.3 LocalStorage Schema

All data lives in a single `localStorage` key:

```json
// localStorage key: "mmBrackets"
{
  "brackets": [
    { "bracketId": "...", "name": "...", "picks": { ... }, ... },
    { "bracketId": "...", "name": "...", "picks": { ... }, ... }
  ]
}
```

On app load, read this key and parse. On every pick, rewrite the full key. Keep it simple — no migrations needed for v1.

---

## 5. Application Screens

### Screen 1 — Home / Bracket List

Shown on app launch. Lists all saved brackets for this device.

**Elements:**
- App title and logo/wordmark
- "Start New Bracket" button (prominent, always at top)
- List of saved brackets, each showing:
  - Bracket name
  - Created date
  - Progress indicator (e.g., "42 of 63 picks made")
  - "Continue" / "View" button
  - "Delete" (with confirmation)
- Empty state if no brackets saved yet

### Screen 2 — Create Bracket

Simple name entry before beginning.

**Elements:**
- Large friendly prompt: "What's your name?" or "Name your bracket"
- Text input (large, touch-friendly)
- "Let's Go!" button to begin the picking flow
- Back to Home

### Screen 3 — Pick Flow (core experience)

The main experience. Displays one matchup at a time and lets the user tap/click a team card to advance.

**Layout:**
- Top bar: current round name + region (e.g., "East — Round 1"), bracket name, progress (e.g., "Game 4 of 32")
- Two large side-by-side team cards (see Team Card spec below)
- "VS" divider between cards
- Tap/click a card = select that team as winner → auto-advance to next game
- Optional back button to revisit previous pick (with confirmation if changing)

**Pick order:** Complete all Round 1 games across all 4 regions, then Round 2, etc. Final Four and Championship come last. This allows the UI to always know both teams for upcoming games.

> **Pick order decision:** Round-by-round. All Round 1 games across regions, then all Round 2, etc. This mirrors how the real tournament unfolds.

**Team Card:**
- Full card background = team's `primaryColor`
- Mascot image (large, centered, ~60% of card height)
- Jersey image (smaller, bottom-left corner or overlapping mascot)
- Team `shortName` in bold (team's `secondaryColor` or high-contrast white/black)
- Seed number badge (e.g., "#1 seed") top-left corner
- Hover/focus state: card lifts with a drop shadow
- Selected state: card gains a prominent ring/glow + checkmark overlay
- Cards should be large enough that images are easily visible on a tablet or desktop screen

### Screen 4 — Bracket Complete / Summary View

Shown when all 63 picks are made.

**Elements:**
- Celebratory header ("🏆 Bracket Complete!")
- Champion team card (large, centered)
- Full bracket visualization — a standard NCAA bracket tree showing all picks
  - Each slot shows team name + seed + small mascot thumbnail
  - Winners highlighted, losers dimmed
- "Print Bracket" button → triggers `window.print()`, hides chrome, shows only bracket
- **Bracket is locked by default** — picks are read-only to prevent accidental changes
- "Unlock to Edit" button → confirmation prompt ("Are you sure? This will let you change your picks.") → unlocks and returns to pick flow
- "Start Another Bracket" button → goes to Screen 2
- "Home" button

### Screen 5 — Bracket View (returning user)

Same as Screen 4 but entered from the Home screen for a completed bracket. Allows viewing, printing, and editing picks.

---

## 6. Print View

When "Print Bracket" is triggered:

- Use a CSS `@media print` stylesheet
- Hide all navigation, buttons, and chrome
- Show only the full bracket tree and bracket name
- Force a white background with black text
- Each team slot = seed + short name (images may be omitted from print, or shown small if they fit)
- Fit to a single landscape page if possible
- Include a footer: "Created with [App Name] · [date]"

---

## 7. Bracket Visualization Component

The bracket tree should visually match the standard NCAA bracket format:

```
Region (East, West, South, Midwest) displayed as 4 quadrants
Final Four in the center connecting the 4 regions
Championship in the absolute center
```

Each game slot = a small card or row showing:
- Seed + team short name
- Optionally a tiny mascot icon

Lines connect winners from left to right (or right to left for the opposite side of the bracket).

This component is used in Screen 4 and Screen 5.

---

## 8. Assets & Configuration

### `teams.json`
Operator-provided. Placed at `/public/data/teams.json` (or equivalent in the chosen framework). The app fetches this at load time. All 64 teams must be present before the app is usable.

### Images
Stored in `/public/assets/jerseys/` and `/public/assets/mascots/`. Named by team `id` (e.g., `duke.png`). Alternatively, `jerseyImage` and `mascotImage` can be absolute URLs to hosted images.

### App Config (`/public/data/config.json`)
```json
{
  "tournamentYear": 2026,
  "appName": "Bracket Buddies",
  "showSeedInCard": true,
  "pickOrder": "round-by-round"
}
```

---

## 9. Technical Recommendations

### Recommended Stack
**React + Vite** — deployable to Netlify, Vercel, or GitHub Pages as a fully static site. No server-side code.

Dependencies to consider:
- `uuid` or `crypto.randomUUID()` — for generating bracket IDs
- `react-to-print` — for print functionality
- No state management library needed; React `useState` + `localStorage` is sufficient for this scope

### localStorage Strategy
- Read on app mount, write on every pick update
- Wrap in try/catch in case storage is full or disabled
- Provide a graceful fallback message if localStorage is unavailable

### Image Loading
- Lazy-load images; show a colored placeholder (team's `primaryColor`) while loading
- If an image 404s, fall back to a simple colored card with just the team name

### Accessibility
- All interactive cards must be keyboard-navigable and have visible focus states
- Team cards should have `aria-label="Pick [Team Name]"` 
- Color alone should not convey pick state (use shape/icon in addition to color)

---

## 10. Future Enhancements (v2+)

- **Score entry mode**: Operator can mark actual game winners; bracket picks are scored automatically
- **Bracket scoring**: Points for correct picks, bonus for upsets
- **Share via URL**: Encode bracket picks as a URL query string for sharing without a backend
- **First Four support**: Add 4 play-in games before Round 1
- **Mobile-first layout**: Currently desktop/tablet focused; a phone-optimized vertical card layout
- **Sound effects**: Fun audio feedback when a pick is made (especially the championship)

---

## 11. Open Questions (Resolved)

- **Pick order:** Round-by-round. All Round 1 games across all regions first, then Round 2, etc. This mirrors the real tournament schedule and is the most intuitive progression for kids following along.
- **Bracket visualization:** Custom CSS/SVG. No external library — build the bracket tree with custom CSS grid/flexbox and SVG connector lines for full control over kid-friendly styling and to keep the bundle small.
- **Image fallback strategy:** Color-only cards. When jersey or mascot images are missing, display a styled card using the team's primary/secondary colors with the team name and seed prominently shown. The app must be fully functional with zero images provided.
- **Bracket locking:** Yes, with unlock button. After all 63 picks are made, the bracket enters a locked state by default. An "Unlock to Edit" button with a confirmation prompt allows intentional changes while preventing accidental pick modifications.

---

## 12. Deliverables Checklist

- [ ] `teams.json` populated with all 64 tournament teams (operator task, post-selection-Sunday)
- [ ] Jersey + mascot images sourced and verified for all 64 teams
- [ ] React + Vite project scaffolded and deployable to static host
- [ ] Home screen with saved bracket list
- [ ] New bracket creation flow
- [ ] Matchup-by-matchup pick flow with team cards
- [ ] Bracket summary / full visualization view
- [ ] Print stylesheet and print button
- [ ] localStorage persistence (read, write, delete)
- [ ] Empty/loading/error states for image failures
- [ ] Basic README with deployment instructions
