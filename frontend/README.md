# DevBoard Frontend

Angular 19 frontend for DevBoard.

## Local Development

Run the frontend:

```bash
npm run start
```

The app runs on `http://localhost:4200` and uses `proxy.conf.json` so frontend code can call `/api/v1/...` while the local backend runs on `http://localhost:5001`.

## Scripts

```bash
npm run build
npm run test
npm run lint
```

From the repository root, use:

```bash
npm run frontend:start
npm run frontend:build
npm run frontend:test
npm run frontend:lint
```

## Architecture

- `src/app/core` contains app-wide infrastructure such as API access, interceptors, layout, services, and tokens.
- `src/app/shared` contains reusable UI and shared frontend models/utilities.
- `src/app/features` contains lazy route boundaries for business features.
- `src/styles` contains design tokens, Material theme integration, and global utilities.

Phase 1 intentionally stops at foundation work. Auth/session behavior, projects, and tasks are implemented in later roadmap phases.
