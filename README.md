# DevBoard

DevBoard is organized as a monorepo for a production-oriented task board platform.

```text
devBoard/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   ├── angular.json
│   └── package.json
├── docs/
├── AGENTS.md
└── README.md
```

## Applications

- `backend/`: Express, MongoDB, Mongoose, Redis, JWT, Swagger, Jest/Supertest, Winston/Morgan, and Docker.
- `frontend/`: Angular 19 standalone app with Angular Material/CDK, SCSS, strict TypeScript/templates, signals-first state services, dark/light themes, and Karma/Jasmine tests.

## Backend Commands

Run backend commands from `backend/`:

```bash
cd backend
npm install
npm run dev
npm test
npm run lint
npm run docker:dev
```

Root proxy commands:

```bash
npm run backend:dev
npm run backend:test
npm run backend:test:coverage
npm run backend:lint
npm run backend:docker:dev
```

Root `npm run dev`, `npm test`, and `npm run lint` still proxy to backend defaults.

## Frontend Commands

Run frontend commands from `frontend/`:

```bash
cd frontend
npm install
npm run start
npm run lint
npm run format:check
npm run test:ci
npm run test:coverage
npm run build:prod
```

Root proxy commands:

```bash
npm run frontend:start
npm run frontend:lint
npm run frontend:format:check
npm run frontend:test:ci
npm run frontend:test:coverage
npm run frontend:build:prod
```

The frontend dev server runs on `http://localhost:4200` and proxies `/api` to the local backend on `http://localhost:5001`.

## Backend API

- Health check: [http://localhost:5001/health](http://localhost:5001/health) for local non-Docker runs.
- Docker health check: [http://localhost:5001/health](http://localhost:5001/health) from the host because Compose maps host `5001` to container `5000`.
- Swagger UI: [http://localhost:5001/api/v1/docs](http://localhost:5001/api/v1/docs).

The frontend integration contract is documented in [docs/backend-api-contract.md](docs/backend-api-contract.md). Swagger under `/api/v1/docs` remains the live route and payload reference.

## Frontend Delivery

The Phase 6 frontend delivery target is a static Angular production build:

```bash
npm run frontend:build:prod
```

Serve `frontend/dist/devboard-frontend` from a static host or reverse proxy with SPA fallback to `index.html`, and forward `/api` or `/api/v1` to the backend. A frontend Dockerfile and E2E browser suite are intentionally deferred.

## Roadmaps

- [Frontend roadmap](docs/frontend-roadmap.md)
- [Backend roadmap](docs/backend-roadmap.md)
- [Engineering guidelines](docs/ai-engineering-guidelines.md)
