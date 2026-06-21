---
title: Carbon
emoji: 🚀
colorFrom: gray
colorTo: pink
sdk: docker
pinned: false
license: mit
---

# Carbon Compass

Carbon Compass is a full-stack carbon footprint tracking application for the PromptWars hackathon challenge by Virtual on hack2skill. It helps individuals log daily activity, understand the largest sources of emissions, act on personalized recommendations, and celebrate small reduction milestones.

## Technology Stack

- Frontend: React 19, TypeScript, Vite, Chart.js, lucide-react
- Backend: Node.js, Express, TypeScript
- Database: SQLite with SQL migrations and indexed user/date queries
- Security: bcrypt password hashing, JWT http-only cookies, Helmet headers, CORS allowlist, parameterized SQL, Zod validation, double-submit CSRF token
- Testing: Vitest, Testing Library, Supertest, V8 coverage

## Features

- Signup, login, logout, and protected API endpoints
- Daily footprint calculator for transportation, energy, diet, and consumption
- Dashboard with footprint trends, comparison charts, action savings, and milestones
- Personalized recommendations based on the user’s latest high-impact categories
- Eco-friendly action logging with estimated kg CO2e savings
- Educational content for non-technical users
- Accessible semantic layout, keyboard-visible focus states, labels, ARIA-friendly controls, and high-contrast colors

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment configuration:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `JWT_SECRET` to a long random value before using the app beyond local development.

3. Run database migrations:

```bash
npm run db:migrate
```

4. Start the application:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to `http://localhost:4000`.

## Testing

Run all tests with coverage:

```bash
npm test
```

The suite includes:

- Unit tests for carbon calculations, recommendations, and milestones
- Integration tests for authentication, CSRF protection, footprint creation, and dashboard data
- Frontend component tests for the authentication UI

Coverage thresholds are configured at 70% in `vitest.config.ts`.

## API Documentation

OpenAPI documentation is available at [docs/openapi.yaml](docs/openapi.yaml).

## Database Schema

The initial migration lives at [server/migrations/001_initial.sql](server/migrations/001_initial.sql) and creates:

- `users`
- `footprint_entries`
- `eco_actions`
- `milestones`
- Indexes on `footprint_entries(user_id, entry_date)` and `eco_actions(user_id, action_date)`

## Project Structure

```text
client/src/          React UI, API client, and styles
server/src/          Express app, repositories, validation, security middleware, services
server/migrations/   SQL migrations
docs/                OpenAPI specification
tests/               Unit, integration, and component tests
```

## Notes for Judges

The emissions factors are intentionally simple and transparent for hackathon usability. In a production deployment, they can be replaced by region-specific datasets without changing the surrounding app architecture because calculation logic is isolated in `server/src/services/carbonCalculator.ts`.
