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
├── docs/
├── AGENTS.md
└── README.md
```

## Applications

- `backend/`: Express, MongoDB, Redis, JWT, Swagger, Jest/Supertest, Docker.
- `frontend/`: reserved for the Angular 19 app planned in Phase 1. No frontend has been scaffolded in Phase 0.

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

For convenience, the repo root proxies the common backend commands:

```bash
npm run backend:dev
npm run backend:test
npm run backend:lint
npm run backend:docker:dev
```

Root `npm run dev`, `npm test`, and `npm run lint` also proxy to the backend during the Phase 0/Phase 1 transition.

## Backend API

- Health check: [http://localhost:5001/health](http://localhost:5001/health) for local non-Docker runs.
- Docker health check: [http://localhost:5001/health](http://localhost:5001/health) from the host because Compose maps host `5001` to container `5000`.
- Swagger UI: [http://localhost:5001/api/v1/docs](http://localhost:5001/api/v1/docs).

The frozen frontend integration contract is documented in [docs/backend-api-contract.md](docs/backend-api-contract.md). Swagger under `/api/v1/docs` remains the live route and payload reference.

## Roadmaps

- [Frontend roadmap](docs/frontend-roadmap.md)
- [Backend roadmap](docs/backend-roadmap.md)
- [Engineering guidelines](docs/ai-engineering-guidelines.md)
