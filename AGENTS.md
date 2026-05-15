# DevBoard Agent Guide

This repository uses a monorepo layout with `backend/` and `frontend/` as top-level folders. The implemented backend lives in `backend/`; do not add backend code to the repository root. Frontend implementation belongs in `frontend/` once its roadmap phase begins.

## Backend Standards

- The current backend in `backend/` is the implemented source of truth.
- The backend stack is Node.js, Express, MongoDB, Mongoose, Redis, JWT, Winston/Morgan, Jest/Supertest, and Docker.
- Follow MVC + service-layer structure strictly.
- Controllers only handle `req`/`res`.
- Business logic belongs in services.
- Use `asyncWrapper` for async routes instead of repeating try/catch in route files.
- Use `ApiError` and `ApiResponse` consistently.
- Preserve current backend API contracts and Swagger docs as the integration contract for frontend work.
- Require testing, linting, structured logging, security middleware, and Docker compatibility for backend changes.

## Frontend Standards

- Use Angular 19.
- Use standalone APIs throughout.
- Use `SCSS` for styling.
- Use Angular Material and Angular CDK as the UI foundation.
- Use signals-first frontend state management; keep RxJS for HTTP and async orchestration, but do not introduce NgRx initially.
- Build dark and light themes from the start.
- Treat accessibility, responsiveness, and web standards as non-optional.

## Backend Integration Rules

- The implemented backend API is the source of truth, not earlier planning text where it differs.
- Use the backend Swagger docs and current response shapes as the contract.
- Access token handling belongs to frontend application state.
- Refresh token remains backend-managed through an `httpOnly` cookie.
- Frontend auth/session logic must support refresh-on-expiry through an interceptor.

## Architecture Rules

- Keep feature boundaries clear: auth, users, projects, tasks.
- Keep API access logic separate from presentation logic.
- Prefer small, composable services and SOLID-friendly boundaries.
- Keep frontend deployable separately from backend, while remaining easy to run together later.

## Quality Rules

- Use strict TypeScript and strict template checks.
- Require linting, formatting, and automated tests.
- Keep the UI responsive for desktop and mobile.
- Respect backend RBAC and never rely on client-only authorization.

## Engineering Rules

- Understand the existing architecture before changing code.
- Reuse existing utilities, services, and components before introducing new ones.
- Prefer incremental improvements over large rewrites.
- Write production-grade code only; do not leave placeholder implementations.
- Avoid `any` in TypeScript and prefer strict typing.
- Keep business logic out of Angular components.
- Do not make API calls directly inside Angular components; use service or facade layers.
- Use `OnPush` change detection by default in Angular unless there is a strong reason not to.
- Use `takeUntilDestroyed` when Angular subscriptions are necessary.
- Avoid nested subscriptions.
- Analyze root cause before patching symptoms during debugging.
- Call out regression risks and edge cases when changing behavior.
- Refactor only when it improves readability, maintainability, scalability, testability, or performance.
- Avoid changing working business logic unnecessarily.
- Consider frontend performance and bundle size during implementation.
- Use lazy loading for frontend feature areas.
- Prefer solutions that are easy to debug and maintain over clever abstractions.

## Communication Style

- Be concise but technically deep.

- Explain enterprise best practices where relevant.

- Mention tradeoffs instead of presenting only one solution.

- For complex topics:

  - provide high-level overview first,

  - then implementation details.

- Avoid generic tutorial-style explanations unless requested.

## Output Expectations

When suggesting implementation:

1. Explain the approach.

2. Mention why this approach is preferred.

3. Mention alternative approaches briefly.

4. Provide clean final code.

5. Mention possible pitfalls or edge cases.

## Planning Reference

The detailed frontend implementation roadmap lives in [`docs/frontend-roadmap.md`](docs/frontend-roadmap.md). Use that document for phase sequencing, feature scope, and future-feature planning.

The detailed backend roadmap lives in [`docs/backend-roadmap.md`](docs/backend-roadmap.md). Use that document for backend phase sequencing, implementation standards, current-state tracking, and future backend feature planning.

Longer engineering behavior guidance lives in [`docs/ai-engineering-guidelines.md`](docs/ai-engineering-guidelines.md). Use that document for coding, debugging, refactoring, and review expectations beyond the repo-specific rules above.
