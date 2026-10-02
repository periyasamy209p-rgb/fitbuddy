# FitBuddy

FitBuddy creates personalized seven-day workout plans, provides goal-specific nutrition tips, and revises plans from user feedback. Gemini powers plan generation, Google Search grounding, and the live voice coach. User and plan data are stored in a local SQLite database.

## Features

- Generate workout plans based on a user's profile, goal, and training intensity.
- Request nutrition and recovery tips.
- Revise plans with follow-up feedback.
- Optionally ground answers with Google Search.
- Chat with a real-time voice coach.
- Review user and plan data in the admin dashboard.

## Requirements

- Node.js 20.19+ (or 22.12+)
- npm or Bun
- A Google Gemini API key

## Getting Started

1. Install dependencies:

   ```sh
   npm install
   ```

   Or, using the included Bun lockfile:

   ```sh
   bun install
   ```

2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.

3. Start the app:

   ```sh
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The server creates `fitbuddy.db` in the project root on first start. The database is local and is not committed to Git.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the app in development mode. |
| `npm run build` | Create a production frontend build in `dist/`. |
| `npm run preview` | Preview the production frontend build with Vite. |
| `npm run lint` | Run the TypeScript check. |
| `npm start` | Start the server. Set `NODE_ENV=production` to serve the production build. |

Build and type-check before starting the production server:

```sh
npm run lint
npm run build
npm start
```

## Project Structure

```text
src/                 React application and UI components
src/components/      Feature-specific interface components
src/utils/           Shared frontend utilities
server/              Gemini integrations and SQLite persistence
server.ts            Express API, WebSocket, and Vite server
data/                App data files
```

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | API key used by server-side Gemini features. |
| `PORT` | No | HTTP port; defaults to `3000`. |
| `DB_PATH` | No | SQLite database path; defaults to `./fitbuddy.db`. |

Keep secrets in `.env` or your hosting provider's environment settings; never commit them or share your API key. The `.env.example` file is safe to commit.

## Deploy on Railway

1. Push this repository to GitHub, then create a Railway project from the repository. Railway uses the included `railway.json` to build the frontend and start the server.
2. In the Railway service, add `GEMINI_API_KEY` and `NODE_ENV=production`.
3. Add a Railway volume mounted at `/data`, then set `DB_PATH` to `/data/fitbuddy.db`. This keeps the SQLite database across deployments. The database download endpoint uses the same configured path.
4. Deploy the service. Railway provides the `PORT` value automatically.

The deployed service needs to run as a persistent Node-compatible process because the app serves its API and live-coach WebSocket from the same server. A static-only deployment will not support those features.
