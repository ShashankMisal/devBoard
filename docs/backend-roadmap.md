# DevBoard Backend Roadmap

This document contains the full backend roadmap for DevBoard, derived from `context.txt` and `phase wise context.txt`, then reconciled against the backend that is actually implemented in this repository today. Stable repo-operating guidance lives in [`../AGENTS.md`](../AGENTS.md).

## Summary

DevBoard backend is a production-oriented REST API for a developer task board system. It is built with:

- Node.js
- Express.js
- MongoDB + Mongoose
- Redis
- JWT
- bcryptjs
- Helmet, rate limiting, validation
- Winston + Morgan
- Jest + Supertest
- Docker + Docker Compose

The backend roadmap was originally phase-based from Foundation through DevOps. Most of that roadmap has been implemented. Where the original plan and the actual repo differ, the repo is the source of truth.

## Current Implemented Status

### Implemented

- Phase 1: foundation
- Phase 2: auth system
- Phase 3: projects, tasks, pagination, RBAC
- Phase 4: production hardening
- Phase 5: testing infrastructure and core test suites
- Phase 6: Docker, Compose, Swagger, lint/format config, README, with local-environment caveats

### Practical Deltas From The Original Roadmap

- ESLint uses `eslint.config.js` flat config instead of legacy `.eslintrc.js`.
- Phase 5 tests exist, but coverage is below the original `80%+` aspiration.
- Swagger was added earlier and then completed as part of Phase 6.
- Local Docker startup may require host-port/container-name adjustment depending on the developer machine environment.

## Target Monorepo Structure

The long-term target is:

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
│   └── ...
├── AGENTS.md
├── README.md
└── docs/
```

Until that restructure happens, the backend currently lives in the repo root.

## Backend Architecture Rules

- Follow MVC + service-layer separation.
- Controllers only coordinate request/response.
- Business logic lives in services.
- Models own schema-level persistence behavior.
- Use `asyncWrapper` for async routes.
- Use `ApiError` and `ApiResponse` consistently.
- Keep cross-cutting concerns in dedicated middleware:
  - auth
  - validation
  - error handling
  - rate limiting
- Use Redis as an optimization layer, not as the source of truth.
- Treat MongoDB as the source of truth for domain data.

## API Contract Summary

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh-token`

### Users

- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `DELETE /api/v1/users/me`

### Projects

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`
- `POST /api/v1/projects/:id/members`

### Tasks

- `GET /api/v1/projects/:projectId/tasks`
- `POST /api/v1/projects/:projectId/tasks`
- `GET /api/v1/tasks/:id`
- `PUT /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

### Supporting Contracts

- consistent `ApiResponse` success envelope
- structured `ApiError` failure shape
- JWT-based auth with refresh-token cookie flow
- pagination metadata for list endpoints

Swagger under `/api/v1/docs` should be treated as the live contract reference.

## Phase 1 — Foundation

Planned scope:

- project manifest and scripts
- env config
- centralized config
- Winston logging
- MongoDB connection
- `ApiError`
- `ApiResponse`
- `asyncWrapper`
- global error handler
- Express app bootstrap
- `index.js` startup

Implemented outcome:

- all foundation pieces exist
- config validation is in place
- structured logger is in place
- DB connection and graceful shutdown are in place

## Phase 2 — Auth System

Planned scope:

- `User` model
- auth validation
- validation middleware
- auth service
- auth middleware
- auth controller/routes
- user controller/routes

Implemented outcome:

- JWT auth and refresh flow exist
- profile endpoints exist
- soft-delete pattern exists for user deactivation
- backend/frontend integration should treat the implemented auth/session behavior as the real contract

## Phase 3 — Core Features

Planned scope:

- `Project` model
- `Task` model
- pagination utility
- project service/controller/routes
- task service/controller/routes
- RBAC

Implemented outcome:

- project CRUD exists
- member management exists
- task CRUD exists
- pagination is implemented
- RBAC rules are enforced in service logic

## Phase 4 — Production Hardening

Planned scope:

- Redis config
- cache utility
- project caching
- rate limiting
- input validation
- security middleware
- request tracing

Implemented outcome:

- Redis-backed cache layer exists
- project reads are cache-aware
- auth/general rate limiting exists
- project/task request validation exists
- Helmet, CORS, sanitize, HPP, and request IDs are in place

## Phase 5 — Testing

Planned scope:

- Jest config
- in-memory Mongo setup
- unit tests
- integration tests
- coverage reporting

Implemented outcome:

- Jest + Supertest + `mongodb-memory-server` setup exists
- auth and project integration tests exist
- auth service and task service unit tests exist
- coverage reporting exists

Known gap:

- coverage is meaningful but below the original `80%+` goal
- some backend areas remain less tested:
  - user service/controller flows
  - deeper task route integration
  - Redis/cache-specific behavior
  - some lifecycle/error branches

## Phase 6 — DevOps

Planned scope:

- Dockerfile
- docker-compose
- dockerignore
- Swagger
- final scripts
- lint/format config
- README

Implemented outcome:

- multi-stage Dockerfile exists
- Docker Compose exists for app + MongoDB + Redis
- `.dockerignore` exists
- Swagger docs exist
- scripts for Docker/lint/test exist
- Prettier config exists
- README exists

Known gap:

- local container startup can still require machine-specific fixes such as:
  - host port remapping because `5000` may already be occupied
  - removal or renaming of conflicting pre-existing Docker containers
  - small Compose hygiene improvements to reduce container-name brittleness

## Testing And Delivery Expectations

- Backend changes should preserve `npm run lint`
- Backend changes should preserve `npm test`
- Docker/Compose changes should preserve local full-stack startup viability
- Swagger should stay aligned with actual routes and payloads
- Any backend refactor should preserve frontend integration assumptions unless explicitly versioned

## Known Backend Improvement Areas

- raise test coverage beyond current level
- add deeper task integration tests
- add fuller user endpoint tests
- improve Docker Compose defaults to reduce host conflicts
- clean remaining doc/runtime inconsistencies as monorepo restructure happens
- optionally introduce contract-sharing or generated API types later for frontend integration

## Future Backend Features

- task comments
- activity timeline
- notifications
- saved filters
- search
- audit logs
- attachments
- admin APIs
- analytics/dashboard APIs
- real-time updates
- project invitations
- sprint/milestone APIs
- task dependency modeling

## Assumptions

- The implemented backend in the repo is the actual source of truth when it differs from earlier planning text.
- `AGENTS.md` remains the short repo-operating guide, while this roadmap holds backend detail.
- The backend will eventually move into `backend/` as part of the monorepo structure, but that restructure is not performed by this document.
