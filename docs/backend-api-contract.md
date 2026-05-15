# DevBoard Backend API Contract

This document freezes the Phase 0 frontend integration contract. The implemented backend and Swagger UI under `/api/v1/docs` remain the source of truth when route-level details differ from planning text.

## Base URL Strategy

- Backend API routes are mounted under `/api/v1`.
- Local frontend code should call `/api` and rely on the Angular dev proxy to forward requests to the backend.
- Deployed frontend builds should use an environment-configured API base URL.
- Local non-Docker backend runs use `PORT=5001` from `backend/.env.development`.
- Docker Compose maps host `5001` to container `5000`.

## Auth Endpoints

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/v1/auth/register` |
| `POST` | `/api/v1/auth/login` |
| `POST` | `/api/v1/auth/logout` |
| `POST` | `/api/v1/auth/refresh-token` |

Register and login return an `accessToken` in the response body and set a `refreshToken` cookie. The refresh cookie is `httpOnly`, `sameSite: lax`, scoped to `/api/v1/auth`, and uses the backend refresh-token expiry.

The refresh endpoint accepts the refresh token from the cookie first, with request-body fallback retained by the backend. Frontend code should rely on the cookie flow.

## Users Endpoints

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/v1/users/me` |
| `PUT` | `/api/v1/users/me` |
| `DELETE` | `/api/v1/users/me` |

## Projects Endpoints

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/v1/projects` |
| `POST` | `/api/v1/projects` |
| `GET` | `/api/v1/projects/:id` |
| `PUT` | `/api/v1/projects/:id` |
| `DELETE` | `/api/v1/projects/:id` |
| `POST` | `/api/v1/projects/:id/members` |

Only projects accessible to the authenticated user are returned. Archived projects are read-only except for the implemented owner status transition back to active.

## Tasks Endpoints

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/v1/projects/:projectId/tasks` |
| `POST` | `/api/v1/projects/:projectId/tasks` |
| `GET` | `/api/v1/tasks/:id` |
| `PUT` | `/api/v1/tasks/:id` |
| `DELETE` | `/api/v1/tasks/:id` |

Task writes are rejected for archived projects. Task access is enforced through project membership/ownership rules.

## Success Envelope

Successful responses use this shape:

```json
{
  "statusCode": 200,
  "message": "Operation completed successfully.",
  "data": {},
  "success": true
}
```

List endpoints that paginate return pagination metadata inside `data` as implemented by the backend service response.

Pagination metadata shape:

```json
{
  "data": [],
  "totalDocs": 0,
  "totalPages": 0,
  "currentPage": 1,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

Pagination accepts positive integer `page` and `limit` query params. Invalid values fall back to defaults, and `limit` is capped at `50`.

## Error Envelope

Error responses use this shape:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid."
    }
  ]
}
```

Non-production responses may include `stack`. Frontend code must not depend on `stack`.

## Frontend Auth Rules

- Store access token in application state, not long-term browser storage by default.
- Attach access token through an interceptor.
- On `401`, attempt refresh once through `/api/v1/auth/refresh-token`.
- Retry the original request after a successful refresh.
- If refresh fails, clear session state and redirect to login.
