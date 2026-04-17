# Artisanal Futures

The web platform for [Artisanal Futures](https://artisanalfutures.org) — a community hub for artisan shops, forums, and cooperative tools.

Built with the [T3 Stack](https://create.t3.gg/): Next.js 15, Prisma, tRPC, Tailwind CSS, and Better Auth.

## Tech Stack

- [Next.js](https://nextjs.org) — App Router (React 19)
- [Better Auth](https://better-auth.com) — Authentication (Discord, Google, Auth0)
- [Prisma](https://prisma.io) — ORM (PostgreSQL, shared with UPCY)
- [tRPC](https://trpc.io) — Type-safe API
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [MinIO](https://min.io) — File storage
- [Resend](https://resend.com) — Email
- [Stripe](https://stripe.com) — Payments
- [Coolify](https://coolify.io) — Website provisioning (WordPress/SimplePress)

## Prerequisites

- [Node.js](https://nodejs.org) (v20+)
- [pnpm](https://pnpm.io) (v9+)
- [Docker](https://docker.com) (for local database)

## Local Development

### 1. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL instance on port `3377` (mapped from container port `5432`).

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in the required values in `.env`. The database URL for the local Docker instance is:

```
DATABASE_URL='postgres://myuser:mypassword@localhost:3377/mydatabase'
```

> **Note:** The database is shared with the UPCY project. Make sure your local Docker volume (`postgres-data`) is consistent across both repos, or point both at the same running container.

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                  | Description                           |
| ------------------------ | ------------------------------------- |
| `pnpm dev`               | Start development server              |
| `pnpm build`             | Build for production                  |
| `pnpm start`             | Start production server               |
| `pnpm lint`              | Lint the codebase                     |
| `pnpm db:generate`       | Generate Prisma client                |
| `pnpm db:migrate`        | Deploy pending migrations             |
| `pnpm db:migrate-create` | Create a new migration (no apply)     |
| `pnpm db:push`           | Push schema changes without migration |
| `pnpm db:studio`         | Open Prisma Studio                    |
| `pnpm test`              | Run tests                             |

## Deployment

The app is deployed via [Coolify](https://coolify.io). Environment variables are managed in the Coolify dashboard.
