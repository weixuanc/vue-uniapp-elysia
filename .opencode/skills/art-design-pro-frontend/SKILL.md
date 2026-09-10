---
name: art-design-pro-frontend
description: Generate frontend business code for the Art Design Pro (Vue 3 + Element Plus + Vite + Tailwind v4 + Pinia + Vue Router) admin app in this monorepo. Use ONLY when the user asks to add a new page/view, route, menu, API client, table page, search form, permission/role guard, theming tweak, or anything inside `apps/web/src/**`. Produces pages, API definitions, routes, stores, and table/search wiring following the project's conventions (HttpError handling, useTable, ArtSearchBar, dynamic/async menu, v-auth / v-roles, Iconify, Tailwind theme variables). Do NOT use this skill for `apps/server`, `apps/gateway`, or `apps/uniapp`.
---

# Art Design Pro Web Frontend Skill

This skill generates frontend code for `apps/web` (Art Design Pro) inside this monorepo. It enforces the project's folder layout, naming, request/response contract, route/menu model, table/search conventions, theming tokens, and icon usage so that every new feature drops in cleanly.

## When to use

- Adding a new business page under `apps/web/src/views/**`
- Adding API client functions under `apps/web/src/api/**`
- Registering routes / menu entries in `apps/web/src/router/modules/**` or `apps/web/src/router/routes/staticRoutes.ts`
- Building table pages with `useTable` + `ArtTable` + `ArtSearchBar`
- Wiring permission directives (`v-auth`, `v-roles`) and `hasAuth()`
- Adding Pinia stores under `apps/web/src/store/modules/**`
- Touching global theme/layout/logo via `apps/web/src/config/**` or `apps/web/src/components/core/base/ArtLogo.vue`
- Adding icon-system entries (`ArtSvgIcon` / offline `@iconify-json/*`)

Skip this skill for `apps/server`, `apps/gateway`, `apps/uniapp`, and any non-Vue code.

## Project facts (read before generating)

- Workspace: monorepo, web app lives in `apps/web/`.
- Runtime: **Bun is preferred** (see `AGENTS.md`). All scripts (`dev`, `build`, `lint`) are still wired through `pnpm`/`npm` because the web app uses Vite + Vue TSC. Use `bun run` to invoke scripts when possible.
- Build tool: **Vite 7** with `@vitejs/plugin-vue`, `@tailwindcss/vite`, `unplugin-auto-import`, `unplugin-vue-components` (Element Plus auto-import), `unplugin-element-plus` (SCSS source for theming), `vite-plugin-vue-devtools`, `vite-plugin-compression`.
- Framework: **Vue 3.5** + `<script setup lang="ts">`.
- UI: **Element Plus 2.11** (auto-imported) + Tailwind v4 + project component library under `src/components/core/**` (prefixed `Art*`).
- State: **Pinia 3** with `pinia-plugin-persistedstate`.
- Routing: **Vue Router 4** with hash history (`createWebHashHistory`).
- i18n: **vue-i18n 9**, messages live in `src/locales/langs/{zh,en}.json`.
- Icons: **Iconify** via `@iconify/vue`; component is `ArtSvgIcon`. Default collection `ri` (Remix Icon). Offline icons via `@iconify-json/*` registered in `src/utils/ui/iconify-loader.ts` and imported from `src/main.ts`.
- HTTP: axios-based wrapper at `src/utils/http/index.ts`. Returns `data.data` (i.e. **only the payload**, not the full `BaseResponse`). Throws `HttpError` with `.code` on failure. `HttpError` is at `src/utils/http/error.ts`.
- Path aliases (from `vite.config.ts`): `@`, `@views`, `@imgs`, `@icons`, `@utils`, `@stores`, `@styles`. Use them; do not invent new ones.
- TypeScript: `strict` is on; `verbatimModuleSyntax` style — use `import type` for types. Global API namespace `Api.*` is declared in `src/types/api/api.d.ts`.
- Two permission modes, toggled via env `VITE_ACCESS_MODE` = `frontend` | `backend` (default is `frontend`).
- Do NOT add code comments unless the user explicitly asks (matches `AGENTS.md` / opencode defaults).
- The pre-built dev server is at port `3006` (`VITE_PORT`); API requests are proxied via `/api` to `VITE_API_PROXY_URL`.

## Required folder layout (web app)

```
apps/web/
├── .env / .env.development / .env.production   # env files (VITE_*)
├── index.html                                  # Vite entry
├── vite.config.ts                              # Vite + auto-import + optimizeDeps
├── tsconfig.json
├── eslint.config.mjs
├── public/                                     # static assets served at root
└── src/
    ├── main.ts                                 # createApp, store/router/i18n/directives
    ├── App.vue
    ├── api/                                    # API client (request wrappers)
    │   ├── auth.ts
    │   └── system-manage.ts
    ├── assets/                                 # images, icons, styles
    ├── components/
    │   ├── business/                           # project-specific components
    │   └── core/                               # Art* design library (base/tables/forms/charts/...)
    ├── config/                                 # system/UI config (logo, theme, menu layout)
    │   ├── index.ts                            # appConfig (systemInfo, themeList, systemMainColor, ...)
    │   ├── setting.ts
    │   ├── assets/images.ts
    │   └── modules/                            # component.ts, fastEnter.ts, festival.ts, headerBar.ts
    ├── directives/                             # v-auth, v-roles, v-highlight, v-ripple
    │   ├── core/{auth,roles}.ts
    │   ├── business/{highlight,ripple}.ts
    │   └── index.ts                            # setupGlobDirectives(app)
    ├── enums/                                  # appEnum.ts (SystemThemeEnum, MenuTypeEnum, ...)
    ├── env.d.ts
    ├── hooks/
    │   ├── core/                               # useAuth, useTheme, useTable, useTableColumns, ...
    │   └── index.ts
    ├── locales/
    │   ├── index.ts                            # createI18n
    │   └── langs/{zh,en}.json
    ├── mock/                                   # offline mock data
    ├── plugins/                                # echarts.ts, index.ts
    ├── router/
    │   ├── index.ts                            # createRouter, initRouter(app), HOME_PAGE_PATH
    │   ├── routes/
    │   │   ├── staticRoutes.ts                 # AppRouteRecordRaw[]
    │   │   └── asyncRoutes.ts                  # re-exports routeModules
    │   ├── modules/                            # one file per feature (system.ts, dashboard.ts, ...)
    │   │   └── index.ts                        # exports `routeModules: AppRouteRecord[]`
    │   ├── guards/{beforeEach,afterEach}.ts
    │   ├── core/                               # ComponentLoader, RouteRegistry, RouteTransformer, ...
    │   └── routesAlias.ts
    ├── store/
    │   ├── index.ts                            # initStore(app)
    │   └── modules/                            # user.ts, menu.ts, setting.ts, worktab.ts, table.ts
    ├── types/
    │   ├── api/api.d.ts                        # global namespace `Api.*`
    │   ├── common/{index,response}.ts          # BaseResponse<T>
    │   ├── component/{chart,index}.ts
    │   ├── config/index.ts
    │   ├── import/{auto-imports,components}.d.ts
    │   ├── router/index.ts                     # AppRouteRecord, MenuListType
    │   └── store/index.ts
    ├── utils/
    │   ├── http/{index,error,status}.ts        # axios wrapper, HttpError, ApiStatus
    │   ├── navigation/{index,jump,route,worktab}.ts
    │   ├── storage/{index,storage,storage-config,storage-key-manager}.ts
    │   ├── sys/{console,error-handle,index,mittBus,upgrade}.ts
    │   ├── table/{tableCache,tableConfig,tableUtils}.ts
    │   ├── ui/{animation,colors,emojo,index,loading,tabs,iconify-loader}.ts
    │   ├── form/{index,responsive,validator}.ts
    │   ├── constants/{index,links}.ts
    │   ├── router.ts                           # configureNProgress, route helpers
    │   └── index.ts
    └── views/                                  # pages (kebab-case folders, PascalCase components)
```

The skill MUST place files exactly under these paths. Never invent alternative roots.

## Generation rules

### 1. HTTP / API contract (mandatory)

- **Base response** is `{ code: number; msg: string; data: T }` — defined in `src/types/common/response.ts` as `BaseResponse<T>`. Do not redefine it.
- `src/utils/http/index.ts` **unwraps** the response: `request.get/post/...` returns `Promise<T>` where `T = res.data.data`. So callers write:
  ```ts
  const { token, refreshToken } = await fetchLogin({ userName, password })
  ```
- Errors are thrown as `HttpError` (import from `@/utils/http/error`). Catch as:
  ```ts
  try { ... } catch (err) {
    if (err instanceof HttpError) {
      // err.code, err.message
    }
  }
  ```
- HTTP status semantics in `utils/http/status.ts` via `ApiStatus` enum (`success`, `unauthorized`, `requestTimeout`, ...). `code === ApiStatus.success` is the success branch.
- 401 handling is centralized with a 3-second debounce and auto `logOut()`.

API client files (`src/api/<feature>.ts`) MUST:
- Import `request` from `@/utils/http` (NOT raw axios).
- Export one function per endpoint: `fetch<Verb><Resource>` (e.g. `fetchLogin`, `fetchGetUserList`).
- Pass typed params from the global `Api.<Feature>.<...Params>` namespace; declare the types under `src/types/api/api.d.ts` in the matching namespace.
- POST/PUT pass payload via `params` (the wrapper auto-promotes `params` to `data` when method is POST/PUT). Prefer that pattern; do not set `Content-Type` manually.
- Use `showSuccessMessage` / `showErrorMessage` flags only when the UX differs from the default.

Example:

```ts
// src/api/auth.ts
import request from '@/utils/http'

export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    params
  })
}

export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>({ url: '/api/user/info' })
}
```

For a new feature, add a new file `src/api/<feature>.ts` AND extend the `Api.<Feature>` namespace in `src/types/api/api.d.ts`. Do NOT inline ad-hoc types in components.

### 2. Pages (`src/views/<feature>/<Page>.vue`)

- One folder per feature, PascalCase component file (e.g. `views/system/user/index.vue`).
- `<template>` MUST have a **single root element**. Vue's `<Transition>` route animation breaks with multi-root templates (or top-level comments). This is the #1 cause of "页面切换一片空白".
  ```vue
  <template>
    <div class="page-content">
      <!-- ... -->
    </div>
  </template>
  ```
- Use `class="page-content"` on the root to fill remaining viewport height (provided by project styles).
- Always declare `<script setup lang="ts">` and use the project's `Art*` components, `useTable`, `ArtSearchBar` instead of reinventing.
- Naming: keep page file names aligned with the `component` field of the route (e.g. `/system/user` → `views/system/user/index.vue`).

### 3. Routes & menus

Two kinds of routes, declared separately:

- **Static** (`src/router/routes/staticRoutes.ts`) — login, register, forget-password, 403, 404, 500, iframe container. No permission needed. `isHideTab: true` for pages that should not appear in the tab bar.
- **Dynamic** (`src/router/modules/<feature>.ts`) — feature pages, may include `meta.roles` (frontend mode) and `meta.authList` (button permission). Modules are re-exported as `routeModules: AppRouteRecord[]` from `src/router/modules/index.ts` and consumed by `asyncRoutes.ts`.

Both use `AppRouteRecord` / `AppRouteRecordRaw`. Definitions follow this exact shape:

```ts
import { AppRouteRecord } from '@/types/router'

export const userRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN'],
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    }
  ]
}
```

Rules:
- Parent routes always use `component: '/index/index'` (the layout shell). Only leaf routes point to a real page via `component: '/<feature>/<page>'`.
- Nested children with no real `component` are valid (grouping menu entries); they keep `meta.title` + `meta.icon` and inherit children.
- `meta.title` should be an i18n key (e.g. `menus.system.user`), NOT a literal string, unless explicitly requested.
- `meta.icon` uses Iconify syntax: `ri:<icon-name>`.
- `meta.keepAlive` controls tab caching. Set to `true` for list pages, `false` for dashboards/real-time.
- `meta.isHide` hides from the menu but keeps the route. `meta.isHideTab` removes it from the tab bar.
- `meta.isFirstLevel` is auto-detected; never set it manually.
- `meta.activePath` is used to highlight a parent menu when the page itself is not in the menu (rare).
- Iframe: `meta.isIframe: true` + `meta.link: 'https://...'` + `component: ''`.
- After adding a module file, re-export it from `src/router/modules/index.ts` so `asyncRoutes` picks it up.

Static routes are also `AppRouteRecordRaw[]` but with `component: () => import('@views/...')`. If the same path exists in both static and dynamic, REMOVE it from the static file — the dynamic registration wins and would conflict.

Home page is configured via `HOME_PAGE_PATH` in `src/router/index.ts` (`''` = use first valid menu path).

### 4. Tables — `useTable` + `ArtTable`

- Compose the table with `useTable` from `@/hooks/core/useTable` (NOT from a composables folder).
- The hook auto-derives `Record`/`Params`/`Response` types from the API function generics. Always pass a typed API function (from `src/api/**`).
- Field-name bridging: the response adapter in `useTable` reads from `src/utils/table/tableConfig.ts`:
  - `recordFields: ['list', 'data', 'records', 'items', 'result', 'rows']`
  - `totalFields: ['total', 'count']`
  - `currentFields: ['current', 'page', 'pageNum']`
  - `sizeFields: ['size', 'pageSize', 'limit']`
  - `paginationKey: { current: 'current', size: 'size' }`
  If the backend uses a field name outside these arrays, extend the array — do NOT write a custom adapter unless shapes diverge structurally.
- The default `responseAdapter` looks for `{ records, total, current, size }`. Backend returns `{ list, total, current, size }` → already supported via `recordFields`.
- Refresh strategies (call after CRUD):
  - `refreshData()` — manual refresh, clears all cache.
  - `refreshSoft()` — clear current-search cache (good for polling).
  - `refreshCreate()` — back to page 1.
  - `refreshUpdate()` — stay on current page.
  - `refreshRemove()` — smart page handling after delete.
- Cache: `performance.enableCache` + `cacheTime` + `maxCacheSize`. Use for read-heavy pages; never for real-time data.
- Search: bind `searchParams` and call `getData()` or `getDataDebounced()`. Reset via `resetSearchParams()`.
- Use `hooks.onError` to map `HttpError.code` → friendly messages (e.g. network errors).

Minimal pattern:

```ts
const {
  data, loading, pagination,
  columns, searchParams,
  handleSizeChange, handleCurrentChange,
  getData, refreshRemove
} = useTable({
  core: {
    apiFn: fetchGetUserList,
    apiParams: { current: 1, size: 20, name: '', status: '' },
    columnsFactory: () => [
      { prop: 'userName', label: '用户名', sortable: true },
      { prop: 'status', label: '状态', useSlot: true }
    ]
  },
  performance: { debounceTime: 300 }
})
```

Wire `ArtTable` `:loading :data :columns :pagination @pagination:size-change @pagination:current-change` exactly as shown in the docs.

### 5. Search forms — `ArtSearchBar`

- Component path: `src/components/core/forms/art-search-bar/...` (auto-imported; no manual import needed for templates).
- Pass `v-model="formData"` (reactive object) and `:items="formItems"` (array of `SearchFormItem`).
- Item shape: `{ label, key, type, placeholder?, props?, span?, labelWidth?, hidden?, slots? }`.
- Supported types (string): `input`, `number`, `select`, `cascader`, `treeselect`, `datetime`, `timepicker`, `switch`, `radiogroup`, `checkboxgroup`, `rate`, `slider`. For custom widgets, set `type` to a render function `() => h(MyComponent, { ... })`, or use the default slot with `key={item.key}`.
- Validation: pass `:rules="rules"` and expose a `ref`. Call `searchBarRef.value?.validate()` in `@search` handler.
- `excludeParams` (in `useTable`) lets you drop keys like `daterange` from the request while keeping them in the form.
- The handler must call `getData()` after applying `Object.assign(searchParams, formData)`.

### 6. Permission

Two modes, switched by `VITE_ACCESS_MODE` in `.env`:

- `frontend` (default): the frontend owns `asyncRoutes` (`src/router/modules/**`). Each route may declare `meta.roles: string[]`. The user-info API returns `roles: string[]`; routes whose roles don't intersect are filtered out. Buttons are gated by user-info `buttons: string[]`.
- `backend`: the login/user-info API returns the full menu tree; the frontend registers it dynamically. `meta.roles` is unnecessary; `meta.authList` (button permission markers) is required for `v-auth` / `hasAuth()`.

Button-level helpers (from `@/hooks/core/useAuth` and `src/directives/core/{auth,roles}.ts`):

```ts
import { useAuth } from '@/hooks/core/useAuth'
const { hasAuth } = useAuth()

// imperative
<ElButton v-if="hasAuth('add')">新增</ElButton>

// declarative
<ElButton v-auth="'add'">新增</ElButton>
<ElButton v-roles="['R_SUPER', 'R_ADMIN']">仅管理员可见</ElButton>
```

Directives are registered globally in `src/main.ts` via `setupGlobDirectives(app)`. Do NOT re-register them.

### 7. Theming

- All colors and tokens live as CSS variables, defined in `src/assets/styles/core/tailwind.css` (and `el-light.scss`, `mixin.scss`). Prefer them over hardcoded hex.
- Base variables:
  - Text: `--art-gray-100` … `--art-gray-900`. Tailwind utilities: `text-g-100` … `text-g-900`.
  - Background: `--default-bg-color` (page), `--default-box-color` (cards). Tailwind: `bg-bg`, `bg-box`.
  - Border: `--default-border`, `--default-border-dashed`.
  - State: `--art-hover-color`, `--art-active-color`.
- Theme colors (OKLCH):
  - `--art-primary`, `--art-secondary`, `--art-success`, `--art-warning`, `--art-error`, `--art-info`, `--art-danger`.
  - Element Plus variants: `--el-color-primary-light-1` … `-light-9` and `dark-1` … `dark-9`. Tailwind: `bg-primary/...`, `text-primary`.
- Project-specific Tailwind utility extensions (use these instead of re-declaring):
  - Flex: `flex-c` (items-center), `flex-b` (justify-between), `flex-cc` (center both), `flex-cb` (center + between).
  - Transition: `tad-200`, `tad-300` (`transition-all duration-200/300`).
  - Borders: `border-full-d`, `border-b-d`, `border-t-d`, `border-l-d`, `border-r-d`.
  - Radius: `rounded-custom-xs`, `rounded-custom-sm`.
  - Cursor: `c-p` (pointer).
- Toggle theme at runtime via `useTheme().switchThemeStyles(SystemThemeEnum.LIGHT | DARK | AUTO)`.
- Change preset colors in `src/config/index.ts` → `systemMainColor`. Apply dynamically via `setElementThemeColor('#xxxxxx')` from `@/utils/ui/colors`.
- Do not write `style="..."` for layout/color when an existing utility class works. Prefer Tailwind utilities → CSS variables → hex only as a last resort.

### 8. Icons

- Always use `<ArtSvgIcon icon="ri:icon-name" />` (auto-imported from `@/components/core/base`).
- Default collection is Remix Icon (`ri:*`). For other icons, install `@iconify-json/<set>` (e.g. `@iconify-json/line-md`), import its JSON in `src/utils/ui/iconify-loader.ts`, call `addCollection(json)`, and import the loader from `src/main.ts`.
- Tailwind classes control size/color: `text-sm`, `text-2xl`, `text-red-500`, `text-primary`, `text-theme`.
- Offline icon list is baked at build time — keep only the collections you actually use to avoid bloat.

### 9. i18n

- Add new strings to `src/locales/langs/zh.json` and `en.json` with the same key path.
- Use in templates as `{{ $t('group.key') }}`. In TS, use `const { t } = useI18n()` or import `$t` from `@/locales`.
- Menu `meta.title` MUST be an i18n key (`menus.system.user`), not a literal string.
- For new locales, extend `messages` in `src/locales/index.ts` and add `LanguageEnum` value in `src/enums/appEnum.ts`.

### 10. Environment variables

- All custom vars must be prefixed `VITE_` (Vite requirement).
- Common keys: `VITE_VERSION`, `VITE_PORT` (default 3006), `VITE_BASE_URL`, `VITE_API_URL`, `VITE_API_PROXY_URL`, `VITE_ACCESS_MODE` (`frontend` | `backend`), `VITE_WITH_CREDENTIALS`, `VITE_OPEN_ROUTE_INFO`, `VITE_LOCK_ENCRYPT_KEY`.
- Access in TS via `import.meta.env.VITE_*`.
- API proxy is wired in `vite.config.ts` → `/api → VITE_API_PROXY_URL`. Backend calls should hit `/api/...`.

### 11. Vite / build pitfalls

- **Blank page on route change** → page has multiple root nodes or top-level comments in `<template>`. Wrap everything in a single root `<div>`, and put comments INSIDE the root.
- **Page auto-refreshes on menu click** → Vite dep optimization. Add the missing dep to `optimizeDeps.include` in `vite.config.ts` (e.g. `element-plus/es/components/tooltip/style/index`). Restart dev server. Only happens in dev mode.
- `optimizeDeps.include` is already preconfigured for `echarts/*`, `xlsx`, `xgplayer`, `crypto-js`, `file-saver`, `vue-img-cutter`, `element-plus/es`, and `element-plus/es/components/*/style/{css,index}`. Extend it when you hit a new dep.
- `vite.config.ts` enables ESLint auto-import globals at `./.auto-import.json` — keep that file in sync by running dev once.

### 12. Layout / logo / settings

- Logo image: `src/components/core/base/ArtLogo.vue` (`src` attribute points to `@imgs/common/logo.png`).
- System name: `src/config/index.ts` → `systemInfo.name`.
- Settings drawer lives in `src/components/core/layouts/**`. Toggle behavior via `src/store/modules/setting.ts`. Do not write ad-hoc localStorage keys — use `@/utils/storage/storage-key-manager.ts`.

## Workflow when invoked

1. Identify the feature name (kebab-case folder under `views/`, `api/`, `router/modules/`, `store/modules/`).
2. If it talks to the backend, add API client functions in `src/api/<feature>.ts` AND extend `Api.<Feature>` namespace in `src/types/api/api.d.ts`.
3. If the page needs persistence in the table-config field list (unlikely), edit `src/utils/table/tableConfig.ts` BEFORE writing the page.
4. Create the page component under `src/views/<feature>/<page>/index.vue` with a single-root template.
5. Register the route:
   - Dynamic (default) → add a module file `src/router/modules/<feature>.ts` (export `xxxRoutes: AppRouteRecord`) and re-export it from `src/router/modules/index.ts`. Set `meta.roles` if frontend-mode + role-gated.
   - Static (no permission) → add to `src/router/routes/staticRoutes.ts`.
6. If the page is a CRUD list, build it with `useTable` + `ArtTable` + `ArtSearchBar`. Use `refreshCreate/Update/Remove` from the matching CRUD hook.
7. Wire permission buttons with `v-auth="'add'|'edit'|'delete'"` or `hasAuth('...')`. Add the markers to `meta.authList` on the parent route.
8. If new Pinia state is needed, add a store module under `src/store/modules/<x>.ts` and register it in `src/store/index.ts` (`initStore`). Use persistedstate where appropriate.
9. Add any new i18n keys to `src/locales/langs/{zh,en}.json` (use i18n keys, never literals, in `meta.title`).
10. Run `bun run lint` (or `pnpm run lint`) before finishing. Run `bun run build` if a full type check is needed (`vue-tsc` is part of the build).
11. List every file created/modified, with absolute paths and a one-line rationale.

## Checklist before finishing

- [ ] API returns use `request` from `@/utils/http`; response is unwrapped (`T`, not `BaseResponse<T>`).
- [ ] Errors are caught as `HttpError` (imported from `@/utils/http/error`).
- [ ] All API types live in `Api.*` namespace in `src/types/api/api.d.ts`.
- [ ] Every page has a SINGLE root element in `<template>` (no top-level comments outside the root).
- [ ] Routes registered through `src/router/modules/<feature>.ts` (dynamic) or `staticRoutes.ts` (static), not via ad-hoc router additions.
- [ ] Dynamic routes use `component: '/index/index'` for parents, `component: '/feature/page'` for leaves.
- [ ] `meta.title` is an i18n key; `meta.icon` is Iconify syntax `ri:*`.
- [ ] Tables built with `useTable` + `ArtTable`; pagination emits wired; refresh strategy chosen per CRUD action.
- [ ] Search forms built with `ArtSearchBar`; `searchParams` synced to `useTable` via `Object.assign` + `getData()`.
- [ ] Button permission uses `v-auth` or `hasAuth()`; markers declared on the parent `meta.authList`.
- [ ] Role gating uses `v-roles` or `meta.roles` (frontend mode only); user-info API returns matching `roles: string[]`.
- [ ] Icons use `ArtSvgIcon`; offline collections registered in `src/utils/ui/iconify-loader.ts` and imported in `main.ts`.
- [ ] Theme/styling uses Tailwind utilities or CSS variables (`--art-*`, `--default-*`), not hardcoded hex.
- [ ] No stray comments added (per `AGENTS.md`); no manual `dotenv` (Vite auto-loads `.env`); no raw `axios` outside `utils/http`.
- [ ] ESLint passes (`bun run lint`); type-check passes if `bun run build` was run.
