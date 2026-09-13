# AU MerchHub

Express/Prisma backend for AU merchandise.

The React frontend is maintained separately at
`https://github.com/ShramanShakya/AUHUB` in its `frontend` directory.

## Local setup

Requirements: Node.js 22 or newer, npm, Docker Desktop, and a Microsoft Entra app registration.

1. Copy `.env.example` to `.env` and fill in the MySQL, Entra, and JWT values.
2. Start MySQL: `docker compose up -d database`.
3. Install dependencies: `npm install`.
4. Generate Prisma Client: `npm run db:generate`.
5. Apply the database migration: `npm run db:migrate`.
6. Add the starter categories: `npm run db:seed`.
7. Start the API: `npm run dev`.
8. Start the separate frontend repository with `npm run frontend:dev`.

The separate frontend development server proxies `/api` to
`http://localhost:3000`. Microsoft Entra must include
`http://localhost:5173` as a Single-page application redirect URI.
New accounts are students by default. Promote staff accounts by setting their `users.role` value to `STAFF` or `ADMIN` in the database.

## Role permissions

- `STUDENT`: browse products, place orders, and view personal orders.
- `STAFF`: create/deactivate products, generate descriptions, and process orders.
- `ADMIN`: all staff permissions plus category management and user role management.

Role changes are enforced by the API immediately. A user who is already signed in
should reload the frontend so its navigation reflects the new role.

Admin-only endpoints:

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`

## Checks

- API health: `http://127.0.0.1:3000/api/health`
- Backend build: `npm run build`
- AI description endpoint: `POST /api/products/generate-description`
