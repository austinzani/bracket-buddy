# Bracket Buddies

A kid-friendly March Madness bracket builder. Pick your winners round-by-round with big, colorful team cards and print your completed bracket to hang on the fridge.

## Features

- 64-team NCAA tournament bracket with all 4 regions
- Round-by-round pick flow with large, tap-friendly team cards
- Automatic downstream pick invalidation when changing earlier rounds
- Full bracket tree visualization
- Print-ready bracket layout (landscape, single page)
- Multiple brackets with localStorage persistence
- Bracket locking with unlock confirmation
- Accessible: keyboard navigation, screen reader support, ARIA labels

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Produces a static site in `dist/` ready for deployment.

## Test

```bash
npm test
```

## Deploy

The `dist/` folder is a fully static site. Deploy to any static host:

- **Netlify**: Connect your repo or drag-and-drop the `dist/` folder
- **Vercel**: Connect your repo, set build command to `npm run build` and output directory to `dist`
- **GitHub Pages**: Push the `dist/` folder to a `gh-pages` branch

## Populating Team Data

Edit `public/data/teams.json` with the current tournament teams. Each team needs:

```json
{
  "id": "unique-id",
  "name": "Full Team Name",
  "shortName": "Short",
  "seed": 1,
  "region": "East",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "jerseyImage": "/images/jerseys/team.png",
  "mascotImage": "/images/mascots/team.png",
  "mascotCostumeImage": ""
}
```

Regions must be: `East`, `West`, `South`, `Midwest`. Each region needs exactly 16 teams seeded 1-16. Images are optional — a basketball icon fallback is shown when images are missing.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- React Router v7
- Vitest + Testing Library
- No backend — fully client-side with localStorage
