# DevBoard API

DevBoard is a production-oriented REST API for a Jira/Trello-style developer task board backend. It uses Express, MongoDB, Redis, JWT auth, structured logging, Swagger docs, and Jest/Supertest test coverage.

## Prerequisites

- Node.js 18+
- npm
- MongoDB and Redis for local non-Docker runs
- Docker and Docker Compose for the containerized setup

## Local Setup

### Run without Docker

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure local env values in `.env.development`.
3. Start MongoDB and Redis locally or in separate containers.
4. Start the app:
   ```bash
   npm run dev
   ```

### Run with Docker

1. Review Docker env values in `.env.docker`.
2. Start the full stack:
   ```bash
   npm run docker:dev
   ```
3. Stop the stack:
   ```bash
   npm run docker:down
   ```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP server port |
| `NODE_ENV` | Runtime environment and env-file selector |
| `MONGODB_URI` | MongoDB connection URI |
| `JWT_ACCESS_SECRET` | Secret for short-lived access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | Access token expiry |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry |
| `REDIS_URL` | Redis connection URI |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist |
| `LOG_LEVEL` | Winston log verbosity |

## Scripts

```bash
npm run dev
npm start
npm test
npm run test:coverage
npm run lint
npm run lint:fix
npm run docker:dev
npm run docker:down
```

## API Docs

- Health check: [http://localhost:5000/health](http://localhost:5000/health)
- Swagger UI: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)

## Endpoint Summary

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/v1/auth/register` |
| `POST` | `/api/v1/auth/login` |
| `POST` | `/api/v1/auth/logout` |
| `POST` | `/api/v1/auth/refresh-token` |
| `GET` | `/api/v1/users/me` |
| `PUT` | `/api/v1/users/me` |
| `DELETE` | `/api/v1/users/me` |
| `GET` | `/api/v1/projects` |
| `POST` | `/api/v1/projects` |
| `GET` | `/api/v1/projects/:id` |
| `PUT` | `/api/v1/projects/:id` |
| `DELETE` | `/api/v1/projects/:id` |
| `POST` | `/api/v1/projects/:id/members` |
| `GET` | `/api/v1/projects/:projectId/tasks` |
| `POST` | `/api/v1/projects/:projectId/tasks` |
| `GET` | `/api/v1/tasks/:id` |
| `PUT` | `/api/v1/tasks/:id` |
| `DELETE` | `/api/v1/tasks/:id` |

## Testing

```bash
npm test
npm run test:coverage
```

The integration suite uses `mongodb-memory-server`, so it does not depend on your local MongoDB data. Redis is bypassed in tests to keep results deterministic.

## Deployment Notes

- The Docker image is multi-stage and runs as a non-root user.
- Runtime secrets should come from env files or your deployment platform, never be baked into the image.
- MongoDB and Redis volumes are configured for local persistence in Docker Compose.

## Common Local Issues

- `EADDRINUSE`: the configured `PORT` is already taken.
- `MongoServerSelectionError`: MongoDB is not reachable at `MONGODB_URI`.
- `CORS policy does not allow access from this origin`: add the frontend origin to `ALLOWED_ORIGINS`.
- Redis warnings at startup: the app stays up, but caching is bypassed until Redis becomes reachable.
