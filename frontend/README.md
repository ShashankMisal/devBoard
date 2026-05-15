# DevBoard Frontend

This directory is intentionally a Phase 0 placeholder.

The Angular 19 frontend will be scaffolded in Phase 1. Until then, this directory exists only to lock the monorepo layout and document the planned local integration strategy:

- frontend source will live under `frontend/`
- frontend code should call `/api`
- the Angular dev proxy will forward `/api` to the backend server
- deployed environments will use an environment-configured API base URL
- access tokens will be held in frontend application state
- refresh tokens remain backend-managed through the `httpOnly` cookie

Do not add frontend implementation here before Phase 1.
