# Docs Screenshot Pipeline

Dev-only tooling that seeds demo data into a LOCAL database and captures the
screenshots used by the af-docs documentation site (`../af-docs`). It never
runs against staging/production:

- Every command layers `.env.docs` over `.env`, overriding `DATABASE_URL` to
  the local docker postgres and `BETTER_AUTH_URL` to `http://localhost:3009`.
- The seed script hard-refuses to run unless the `DATABASE_URL` host is
  `localhost`/`127.0.0.1` — running it without `.env.docs` exits with an error
  before opening any connection.
- The dev server runs on port **3009**, so it never collides with (or reuses)
  a normal `pnpm dev` session on :3000 pointed at staging.
- Demo data lives in a dedicated **`af_docs`** database inside the docker
  postgres — not `mydatabase`, which is an older dev DB shared with the UPCY
  project and left untouched.

## One-time setup

```bash
docker compose up -d                     # local postgres on :3377
pnpm exec playwright install chromium    # headless browser for screenshots
```

If the `af_docs` database doesn't exist yet (fresh volume):

```bash
docker exec artisanal-futures-site-postgres-1 psql -U myuser -d mydatabase -c "CREATE DATABASE af_docs;"
DATABASE_URL="postgresql://myuser:mypassword@localhost:3377/af_docs" pnpm exec prisma db push --schema ./prisma --skip-generate
pnpm exec tsx --env-file=.env --env-file=.env.docs prisma/seed.ts   # product/service categories
```

If `.env.docs` is missing (it's gitignored), recreate it with:

```
DATABASE_URL="postgresql://myuser:mypassword@localhost:3377/af_docs"
BETTER_AUTH_URL="http://localhost:3009"
```

## Refresh workflow

> **After pulling commits that change the Prisma schema**, re-run the
> `db push` command from the one-time setup above against `af_docs` first —
> otherwise the dev server queries columns the local DB doesn't have yet and
> every screenshot fails with a Prisma error.

1. `docker compose up -d`
2. `pnpm docs:seed` — creates the demo users and demo content, idempotently
   (safe to re-run; every step is create-if-not-exists)
3. `SHOTS_OUT_DIR=../af-docs/public/images pnpm docs:shots` — boots the dev
   server on :3009, signs both demo users in once, and captures the shot list
   straight into the docs site. (Omit `SHOTS_OUT_DIR` to stage locally in
   `docs-assets/screenshots/` instead.)
4. Review the image diff in `af-docs`, then commit manually.

When the UI changes, edit `e2e/shot-list.ts` (add/adjust `{ id, path, role }`
entries) and re-run step 3. Screenshot ids are namespaced (`admins/invites`)
and become `<outdir>/<id>.png`.

## Demo credentials (local only)

| User | Email | Role |
|---|---|---|
| Demo Admin | demo-admin@artisanalfutures.org | ADMIN |
| Demo Artisan | demo-artisan@artisanalfutures.org | ARTISAN |

Password for both: `DOCS_DEMO_PASSWORD` env var, defaulting to
`DocsDemo!Local123`. These accounts exist only in the local `af_docs`
database; the seed creates them through the real invite-gated sign-up flow
(codes `DOCS-DEMO-ADMIN` / `DOCS-DEMO-ARTISAN`).

## Files

- `playwright.config.ts` — Playwright config (webServer `pnpm dev -p 3009`,
  chromium only, 1440×900)
- `e2e/auth.setup.ts` — signs the demo users in via the better-auth API,
  saves storage state to `e2e/.auth/` (gitignored)
- `e2e/shot-list.ts` — the shot list; edit this when the UI changes
- `e2e/screenshots.spec.ts` — the runner (strips the Next dev-mode overlay
  before each capture)
- `scripts/docs/seed-demo.ts` — demo data seed (hard localhost guard)
- `.env.docs` — local-only env overrides (gitignored)

## Env layering (why the script strings look the way they do)

- `docs:seed` uses `tsx --env-file=.env --env-file=.env.docs` — with node's
  `--env-file`, the **later** file wins.
- `docs:shots` uses `dotenv -e .env.docs -e .env` — with dotenv-cli, the
  **first** file wins.

Both orderings were verified to resolve `DATABASE_URL` to localhost. Don't
reorder them.
