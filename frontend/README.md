# DevBoard Frontend

Angular 19 frontend for DevBoard. The app uses standalone APIs, Angular Material/CDK, SCSS, strict TypeScript, strict templates, and signals-first state services.

## Setup

Install frontend dependencies from this directory:

```bash
npm install
```

Run the local development server:

```bash
npm run start
```

The app runs on `http://localhost:4200`. Local API calls use `proxy.conf.json`, so frontend code calls `/api/v1/...` and the Angular dev server forwards `/api` to the backend at `http://localhost:5001`.

Start the backend separately before using authenticated flows:

```bash
cd ../backend
npm run dev
```

## Scripts

From `frontend/`:

```bash
npm run start
npm run lint
npm run format:check
npm run test:ci
npm run test:coverage
npm run build:prod
```

From the repository root:

```bash
npm run frontend:start
npm run frontend:lint
npm run frontend:format:check
npm run frontend:test:ci
npm run frontend:test:coverage
npm run frontend:build:prod
```

Use `npm run format` from `frontend/` or `npm run frontend:format` from the root to apply Prettier formatting.

## Architecture

- `src/app/core` contains app-wide infrastructure: API client, auth/session state, guards, interceptors, layout, services, and injection tokens.
- `src/app/shared` contains reusable UI and utilities that do not own business workflows.
- `src/app/features` contains lazy feature boundaries for auth, dashboard, profile, projects, and tasks.
- `src/styles` contains design tokens, Material theme integration, mixins, and global utilities.

Components stay presentation-focused. API access belongs in feature/core services, and business state belongs in service/facade layers instead of Angular components.

## Backend Integration

- The backend contract is the implemented Express API and Swagger docs, with routes under `/api/v1`.
- Frontend API calls use the shared API client and typed response models.
- Access tokens are kept in frontend session state.
- Refresh tokens remain backend-managed through an `httpOnly` cookie.
- The auth interceptor attaches bearer tokens, refreshes on eligible `401` responses, retries the original request once, and clears the session if refresh fails.
- Backend validation errors are normalized and mapped to form-level or field-level UI errors.
- Project Kanban uses `GET /api/v1/projects/:projectId/tasks/board` for grouped task board data and `PUT /api/v1/tasks/:id` for drag-to-status updates.

## Task Board

Project detail pages use a Kanban board as the default task view. The board has fixed `To do`, `In progress`, and `Done` columns backed by backend task status values.

- Dragging a task to another column immediately updates local board state and persists through the existing task update endpoint.
- Failed drag updates roll back the local board state and show an error notification.
- Archived projects remain readable but disable task creation, editing, deletion, and drag moves.
- Users can switch to the paginated list view with the board/list toggle.
- Task create, detail, edit, and delete flows continue to use the task side panel.

## Theme System

The app supports light, dark, and system theme modes from `ThemeService`. Theme state is persisted in `localStorage` under `devboard.theme`, then applied to the document root with `data-theme`, `data-theme-mode`, and `color-scheme`.

Material component colors are configured in `src/styles/_material.scss`; app-level design tokens live in `src/styles/_tokens.scss`.

## Testing

The Phase 6 test stack is Karma/Jasmine with Angular testing utilities.

```bash
npm run test:ci
npm run test:coverage
```

Coverage reporting is available, but hard coverage gates are intentionally deferred until the project raises the baseline. The current suite covers API clients, auth/session flows, guards, interceptors, state services, forms, dialogs, lists, and shared utilities.

Kanban coverage includes the board API service, task board state, board rendering, empty columns, and optimistic move rollback behavior.

E2E happy-path tests are deferred and should be added later with a dedicated browser test stack.

## Production Build And Delivery

Build static production artifacts with:

```bash
npm run build:prod
```

The output is written to `dist/devboard-frontend`. Phase 6 targets static hosting or serving behind a reverse proxy. Configure the deployment layer to:

- serve Angular routes with a fallback to `index.html`
- forward `/api` or `/api/v1` to the backend API
- preserve backend-managed refresh-token cookies
- serve the built assets over HTTPS in production

A frontend Dockerfile is intentionally deferred. The current production build may emit Angular budget warnings for the initial bundle and one project detail stylesheet; these are delivery follow-ups unless they become build errors.
