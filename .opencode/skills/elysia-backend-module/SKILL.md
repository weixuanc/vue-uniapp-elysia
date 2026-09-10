---
name: elysia-backend-module
description: Generate backend server business code for the Elysia (Bun + Drizzle + Redis/BullMQ) stack in this monorepo. Use ONLY when the user asks to add a new feature module, controller, service, model, queue job, or anything inside `apps/server/src/modules/**` or `apps/server/src/{config,database,queue,utils}/**`. Produces a complete module (controller + service + model + DB schema when needed) following the official Elysia Best Practice (Service / Controller / Model / Utility) and the project's folder convention. Do NOT use this skill for the `apps/gateway`, `apps/web`, or `apps/uniapp` apps.
---

# Elysia Backend Module Generator

This skill generates backend business code for the Elysia server in this monorepo. It enforces the project's folder layout, naming, and stack conventions so every new module drops in cleanly.

## When to use

- Adding a new business feature to `apps/server/src/modules/<feature>/`
- Creating a new queue producer/worker/job under `apps/server/src/queue/`
- Adding shared infrastructure under `apps/server/src/{config,database,utils}/`
- Touching `apps/server/src/index.ts` to mount a new module

Skip this skill for `apps/gateway`, `apps/web`, `apps/uniapp`, and any non-Elysia code.

## Project facts (read before generating)

- Runtime: **Bun** (see `AGENTS.md`). Always use `bun`, never `node`/`npm`/`yarn`.
- Server entry: `apps/server/src/index.ts` (already a Bun workspace filter, see root `package.json`).
- Server scripts: `apps/server/package.json` → `bun run dev` (already wired as `bun run --watch src/index.ts`).
- Config: Bun auto-loads `.env` — never add `dotenv`.
- Bun APIs only for low-level: `Bun.serve`, `Bun.redis`, `Bun.sql`, `bun:sqlite`, `Bun.file`. No `express`, `ioredis`, `pg`, `ws`, `better-sqlite3`.
- TypeScript: `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`. Use `import type` for type-only imports.
- HTTP stack: Elysia with feature-based modules. Validation via TypeBox (`drizzle-typebox` for DB-driven models).
- Persistence: Drizzle ORM (Postgres in prod, swap to `bun:sqlite` if local). Single source of truth: `apps/server/src/database/schema.ts`.
- Jobs: BullMQ on a shared `Bun.redis` / `ioredis` client. Workers MUST run as a separate process entry (`apps/server/src/queue/worker.ts`), never inline the HTTP server.
- No comments in code unless the user explicitly asks (matches `AGENTS.md` / opencode defaults).

## Required folder layout

```
apps/server/src/
├── index.ts                          # Elysia app entry, mounts modules
├── config/
│   ├── index.ts                      # env config object
│   ├── database.ts                   # drizzle client (Postgres or bun:sqlite)
│   └── redis.ts                      # shared Redis client (Bun.redis or ioredis)
├── database/
│   ├── schema.ts                     # ALL pg/sqlite tables live here, re-exported as `table`
│   └── migrations/                   # drizzle-kit output
├── modules/<feature>/
│   ├── index.ts                      # controller (Elysia instance with .post/.get/...)
│   ├── service.ts                    # static-method service, decoupled from Elysia
│   └── model.ts                      # TypeBox models (prefer drizzle-typebox)
├── queue/
│   ├── producer.ts                   # BullMQ producers (one fn per job)
│   ├── worker.ts                     # BullMQ workers, separate process
│   └── jobs.ts                       # job payload types + queue name constants
└── utils/
    └── response.ts                   # ok/fail helpers
```

The skill MUST place files exactly under these paths. Never invent alternative roots.

## Generation rules

### 1. Controller (`modules/<feature>/index.ts`)

- Export a named `const <feature>Controller = new Elysia({ prefix: '/<feature>' })`.
- TypeBox is imported as `import { t } from 'elysia'`.
- Validation: prefer `body: <feature>Model.create` over inline `t.Object({...})`.
- Pass ONLY specific data into the service: `({ body }) => FeatureService.create(body)` — never pass the whole context.
- For request-scoped state (auth, db transaction), use `new Elysia({ name: '<feature>.service', ... })` so the plugin is deduplicated.
- Mount into the entry via `.use(featureController)`; do not start a new listener here.

### 2. Service (`modules/<feature>/service.ts`)

- `export abstract class FeatureService { static async ... }` — no instance state.
- Import the shared `db` and `table` objects; never instantiate a new client.
- Inputs are plain typed objects (derive the type from the model: `type Create<Feature> = typeof featureModel.create.static`).
- Throw plain `Error` (or a typed subclass) — never `status(code, ...)` from inside the service.
- For pagination, accept `{ page, pageSize, ...filters }` and return `{ list, total }`.
- Bulk ops use `db.insert(table.x).values(arr).returning()` or `db.transaction(...)`.

### 3. Model (`modules/<feature>/model.ts`)

Prefer `drizzle-typebox` to derive models from the schema. ALWAYS assign the raw schema to a `_local` const first, then wrap with `t.Omit`/`t.Pick` to dodge "Type instantiation is possibly infinite":

```ts
import { t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { table } from '../../database/schema'

const _create = createInsertSchema(table.user, {
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8, maxLength: 255 })
})
const _select = createSelectSchema(table.user)

export const userModel = {
  create: t.Omit(_create, ['id', 'createdAt']),
  update: t.Partial(t.Omit(_create, ['id', 'createdAt'])),
  entity: _select,
  listQuery: t.Object({
    page: t.Optional(t.Integer({ minimum: 1, default: 1 })),
    pageSize: t.Optional(t.Integer({ minimum: 1, maximum: 100, default: 20 })),
    keyword: t.Optional(t.String())
  })
}

export type CreateUser = typeof userModel.create.static
export type UpdateUser = typeof userModel.update.static
export type UserEntity = typeof userModel.entity.static
```

If the schema cannot come from Drizzle, fall back to `t.Object({...})` and still export a `static` type alias.

### 4. Database schema (`database/schema.ts`)

- One `pgTable` (or sqlite equivalent) per entity; re-export everything as `table` and export the `Table` type.
- IDs: `varchar('id', { length: 24 }).primaryKey().$defaultFn(() => createId())` using `@paralleldrive/cuid2`.
- Timestamps: `timestamp('created_at').defaultNow().notNull()` and `timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()`.
- When adding a new table, also wire the relation via Drizzle `relations()` if it links to another table.

### 5. Config (`config/*`)

- `config/index.ts`: a `const config = { port, databaseUrl, redisUrl, ... } as const`; reads `process.env` with `??` defaults.
- `config/database.ts`: builds the drizzle client ONCE and exports it as `db`. Do not export the pool.
- `config/redis.ts`: builds the shared Redis client ONCE and exports it. BullMQ requires `maxRetriesPerRequest: null` when using `ioredis`.

### 6. Queue (`queue/*`)

- `queue/jobs.ts`: define a TS type per job and a `QUEUE_NAME` constant.
- `queue/producer.ts`: one `enqueue<Name>(payload)` function per job; set `attempts`/`backoff` defaults.
- `queue/worker.ts`: register `new Worker<JobType>(QUEUE_NAME, async (job) => { ... }, { connection: redis })`; attach `completed`/`failed` listeners. Document in a comment in `index.ts` that the worker runs via `bun run apps/server/src/queue/worker.ts`.
- Producers run inside the HTTP process; workers run as a separate Bun entry — never both in the same file.

### 7. Entry point (`index.ts`)

- Compose all controllers via `.use(featureController)`.
- Listen with `app.listen(config.port)`; print `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`.

## Workflow when invoked

1. Identify the feature name (kebab-case folder) and the route prefix (kebab-case, plural when natural).
2. If the feature needs persistence and the table does not exist, add it to `database/schema.ts` first and run `bunx drizzle-kit generate` (or instruct the user to).
3. Generate the three files under `apps/server/src/modules/<feature>/`.
4. Wire the controller into `apps/server/src/index.ts` (read it first; never overwrite unrelated code).
5. If the feature emits jobs, add the producer function and reference it from the service; instruct the user to also wire the worker entry.
6. List every file you created or modified, with absolute paths and a one-line rationale.

## Checklist before finishing

- [ ] Service never imports `elysia` or `Bun.serve`.
- [ ] Controller imports service and model only — no DB or Redis.
- [ ] `drizzle-typebox` schemas are wrapped via a `_local` const.
- [ ] New tables added to `database/schema.ts` and re-exported under `table`.
- [ ] Shared `db` and `redis` clients are reused, never re-created.
- [ ] Worker code (if any) lives in `queue/worker.ts`, not in the HTTP entry.
- [ ] All env vars go through `config/index.ts`.
- [ ] No `dotenv`, no `ioredis`+`pg`+`ws`/`better-sqlite3`/`express` per AGENTS.md.
- [ ] Type-only imports use `import type` (matches `verbatimModuleSyntax`).
- [ ] No stray comments added.
