# DevBoard Frontend Roadmap

This document contains the full phase-wise frontend plan for DevBoard. Stable repo-operating guidance lives in [`../AGENTS.md`](../AGENTS.md).

## Summary

Build the DevBoard frontend as an Angular 19 application inside the existing `devBoard` git repo, using a monorepo layout with `backend/` and `frontend/` folders. The frontend must integrate with the backend that already exists today and remain deployable separately later.

Core choices:

- one git repo
- move current backend into `backend/`
- create Angular app in `frontend/`
- do not use nested git repos or subrepos
- Angular 19 + standalone APIs
- SCSS
- Angular Material + Angular CDK
- signals-first state management
- dark/light theme from the start
- strict TypeScript and strict templates

## Target Monorepo Structure

```text
devBoard/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.development
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── AGENTS.md
├── README.md
└── docs/
```

### Frontend App Structure

```text
frontend/src/
├── app/
│   ├── core/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── layout/
│   │   ├── services/
│   │   └── tokens/
│   ├── shared/
│   │   ├── ui/
│   │   ├── pipes/
│   │   ├── directives/
│   │   ├── utils/
│   │   └── models/
│   ├── features/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   └── tasks/
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.component.ts
├── styles/
│   ├── _tokens.scss
│   ├── _theme.scss
│   ├── _material.scss
│   ├── _mixins.scss
│   └── _utilities.scss
├── styles.scss
└── index.html
```

## Global Decisions

- Use `SCSS` project-wide.
- Use Angular Material + Angular CDK as the UI foundation.
- Use signals + services by default; no NgRx initially.
- Use backend Swagger and implemented response shapes as the contract source of truth.
- Access token is managed in frontend memory/state, not long-term browser storage by default.
- Refresh token remains in backend-managed `httpOnly` cookie.
- Use Angular dev proxy for local frontend-to-backend development:
  - frontend code calls `/api`
  - local dev proxy forwards `/api` to the backend server
  - deployed environments use an environment-configured API base URL
- Keep frontend deployable separately from backend.
- Accessibility, responsiveness, and theme support are first-class requirements.
- Root-level orchestration is the long-term direction after the repo is split into `backend/` and `frontend/`, while app-specific scripts stay inside each app.

## Phase 0 — Repo Restructure And Contract Lock

- Move the current backend into `backend/` without changing backend behavior.
- Keep backend scripts/config/docs working after the move.
- Create `frontend/` only after the repo structure is stable.
- Freeze the backend contract for frontend integration:
  - auth endpoints
  - users endpoints
  - projects endpoints
  - tasks endpoints
  - pagination shape
  - error shape
  - refresh-token behavior
- Define frontend env strategy and local API proxy setup.

Deliverables:

- monorepo structure in place
- backend still runnable
- frontend can be scaffolded against a stable API base URL strategy

Current Phase 0 status:

- backend code and runtime configuration live under `backend/`
- `frontend/` exists only as a placeholder for the Phase 1 Angular scaffold
- the frozen integration contract is documented in [`backend-api-contract.md`](backend-api-contract.md)

## Phase 1 — Frontend Foundation

- Create Angular 19 app in `frontend/`.
- Use standalone bootstrap, standalone routing, Angular control flow, and strict TS/template modes.
- Set up:
  - Angular Material
  - Angular CDK
  - SCSS theme architecture
  - app shell
  - responsive layout
  - global typography and spacing tokens
- Add core infrastructure:
  - API client abstraction
  - typed API envelope models
  - global error model
  - loading indicator
  - toast/snackbar notifications
  - lazy-loaded route structure
- Implement theme system:
  - dark/light mode
  - Material theme integration
  - CSS variables for app-level tokens
  - theme persistence
  - system preference default

Deliverables:

- Angular app boots cleanly
- Material theme works in light and dark mode
- responsive shell exists
- API base wiring and proxy setup exist

## Phase 2 — Auth And Session Layer

Integrate with:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh-token`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `DELETE /api/v1/users/me`

Implement:

- register page
- login page
- logout action
- session bootstrap on app load
- auth guard
- guest-only guard
- session service
- auth interceptor
- profile page
- profile update
- account deactivate flow

Rules:

- attach access token through interceptor
- on `401`, try refresh once
- retry original request after refresh
- if refresh fails, clear session and redirect to login
- on full page reload, use the refresh-token flow during app bootstrap to restore the session instead of persisting the access token long-term
- map backend validation errors cleanly to Angular forms

Deliverables:

- full auth/session UX
- protected routing
- working refresh-token flow integrated with backend cookies

## Phase 3 — Projects Workspace

Integrate with:

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`
- `POST /api/v1/projects/:id/members`

Implement:

- project dashboard/list page
- project create form
- project detail page
- project edit/archive flow
- member add flow
- pagination and filtering UI
- empty and no-access states

Rules:

- only owner/member projects appear
- archived projects are readable but read-only
- owner-only actions hidden or disabled for non-owners
- query params drive page/filter state

Deliverables:

- project CRUD UI
- member management
- pagination wired to backend
- RBAC-aware project actions

## Phase 4 — Tasks Experience

Integrate with:

- `GET /api/v1/projects/:projectId/tasks`
- `POST /api/v1/projects/:projectId/tasks`
- `GET /api/v1/tasks/:id`
- `PUT /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

Implement:

- task list inside project detail
- task create/edit/delete flows
- task detail modal or side panel
- filters by status and priority
- sorting by due date and priority
- pagination

Initial UX choice:

- list/detail first
- Kanban later

Rules:

- archived projects disable task writes
- update/delete actions shown only where meaningful
- filters and pagination stay server-backed

Deliverables:

- full project-task working surface
- task CRUD aligned to backend RBAC and pagination

## Phase 5 — Frontend Hardening

- Add:
  - HTTP error normalization
  - selective retry behavior
  - reusable form + error abstractions
  - skeleton loaders
  - empty/no-result states
- Accessibility:
  - keyboard navigation
  - focus management
  - semantic landmarks
  - dialog accessibility
  - contrast validation
- Performance:
  - route lazy loading
  - deferrable/non-critical content loading
  - bundle discipline
- Add dashboard landing page:
  - recent projects
  - assigned task summary
  - quick actions

Deliverables:

- frontend feels production-ready
- accessible and responsive
- architecture remains scalable

## Phase 6 — Frontend Testing And Delivery

- Add:
  - unit tests for helpers and state logic
  - component tests for forms, lists, dialogs, guards
  - integration tests for interceptors/auth/session flow
  - optional E2E happy path
- Add tooling:
  - ESLint
  - Prettier
  - test scripts
  - production build scripts
- Add frontend docs:
  - setup
  - env config
  - architecture
  - theme system
  - testing
- Prepare delivery:
  - frontend Dockerfile later if needed
  - or static build deployment if hosted separately
  - full-stack deployment compatibility with backend

Deliverables:

- tested frontend
- documented setup
- production build ready
- deployable alongside backend cleanly

## Integration Rules With Existing Backend

- Use the implemented backend response envelope consistently.
- Map backend validation errors to field-level and form-level UI errors.
- Respect backend auth design:
  - access token in response body
  - refresh token in cookie
- Respect backend RBAC and do not rely on client-only authorization.
- Use backend pagination metadata as-is.
- Prefer backend-driven truth for project/task transitions.

## Future Features

- Kanban drag-and-drop
- task comments
- activity timeline
- project invites
- notifications and reminders
- saved filters
- search
- dashboard analytics
- audit logs
- file attachments
- avatars/profile settings
- real-time updates
- admin panel
- PWA/offline draft support
- localization
- workspace settings
- task dependencies
- sprint/milestone planning

## Acceptance Criteria

- Backend still runs after move to `backend/`.
- Frontend runs independently in `frontend/`.
- Login/register/logout/refresh work against live backend.
- Project CRUD works end to end.
- Task CRUD works end to end.
- Dark/light theme works across the app.
- Desktop and mobile layouts both work.
- Guards and interceptors behave correctly on token expiry.
- Frontend build is production-safe.
- Repo structure remains clean for later deployment.

## Assumptions

- One monorepo is the correct setup for DevBoard right now.
- Backend should be reorganized into `backend/` before frontend implementation begins.
- Angular Material and SCSS are mandatory frontend choices.
- Signals + services are the default state model; NgRx is deferred.
- Initial tasks UX should be list/detail, not Kanban-first.
- Frontend and backend should integrate smoothly now and remain separately deployable later.
