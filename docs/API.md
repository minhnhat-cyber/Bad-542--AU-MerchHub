# API Summary

Local base URL: `http://127.0.0.1:3000/api`

Production base URL: `https://YOUR_DOMAIN/merchhub-api/api`

Protected routes require `Authorization: Bearer <application-jwt>`.

## Public and authentication

- `GET /health`
- `POST /auth/microsoft`
- `GET /auth/me` (authenticated)
- `GET /categories`
- `GET /products`

## Student

- `POST /orders`
- `GET /orders/mine`

## Staff and administrator

- `POST /products`
- `DELETE /products/:id`
- `POST /products/generate-description`
- `GET /orders`
- `PATCH /orders/:id/status`

## Administrator

- `GET /admin/users`
- `PATCH /admin/users/:id/role`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

Request validation schemas and response details are implemented next to each
route under `src/schemas` and `src/routes`.
