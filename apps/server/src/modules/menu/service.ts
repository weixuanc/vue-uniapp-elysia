import { asc, eq } from 'drizzle-orm'
import { db } from '../../config/database'
import { menus, roleMenus, userRoles } from '../../database/schema'

export interface AppRouteRecord {
  id?: number
  name: string
  path: string
  redirect?: string
  component?: string
  meta: {
    title: string
    icon?: string
    showBadge?: boolean
    showTextBadge?: string
    isHide?: boolean
    isHideTab?: boolean
    link?: string
    isIframe?: boolean
    keepAlive?: boolean
    authList?: Array<{ title: string; authMark: string }>
    isFirstLevel?: boolean
    roles?: string[]
    fixedTab?: boolean
    activePath?: string
    isFullPage?: boolean
    isAuthButton?: boolean
    authMark?: string
    parentPath?: string
  }
  children?: AppRouteRecord[]
}

interface MenuRow {
  id: number
  parentId: number
  path: string
  name: string
  title: string
  icon: string | null
  hide: boolean
  component: string | null
  redirect: string | null
  authMark: string | null
  type: string
  keepAlive: boolean
  fixedTab: boolean
  sort: number
}

const toRoute = (row: MenuRow): AppRouteRecord => {
  const record: AppRouteRecord = {
    id: row.id,
    name: row.name,
    path: row.path,
    meta: {
      title: row.title,
      icon: row.icon ?? undefined,
      isHide: row.hide,
      keepAlive: row.keepAlive,
      fixedTab: row.fixedTab,
      authList: row.authMark
        ? [{ title: row.title, authMark: row.authMark }]
        : undefined
    },
    component: row.component ?? undefined
  }
  if (row.redirect) record.redirect = row.redirect
  return record
}

const buildTree = (flat: MenuRow[]): AppRouteRecord[] => {
  const map = new Map<number, AppRouteRecord>()
  const roots: AppRouteRecord[] = []

  for (const row of flat) {
    map.set(row.id, toRoute(row))
  }

  for (const row of flat) {
    const node = map.get(row.id)!
    if (row.parentId === 0 || !map.has(row.parentId)) {
      roots.push(node)
    } else {
      const parent = map.get(row.parentId)!
      parent.children ??= []
      parent.children.push(node)
    }
  }

  return roots
}

export abstract class MenuService {
  static async listByUser(userId: number): Promise<AppRouteRecord[]> {
    const roleIdRows = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))

    const roleIds = roleIdRows.map((r) => r.roleId)
    if (roleIds.length === 0) return []

    const menuRows = await db
      .selectDistinct({
        id: menus.id,
        parentId: menus.parentId,
        path: menus.path,
        name: menus.name,
        title: menus.title,
        icon: menus.icon,
        hide: menus.hide,
        component: menus.component,
        redirect: menus.redirect,
        authMark: menus.authMark,
        type: menus.type,
        keepAlive: menus.keepAlive,
        fixedTab: menus.fixedTab,
        sort: menus.sort
      })
      .from(roleMenus)
      .innerJoin(menus, eq(roleMenus.menuId, menus.id))
      .where(eq(roleMenus.roleId, roleIds[0]!))

    if (roleIds.length > 1) {
      const additional = await Promise.all(
        roleIds.slice(1).map((roleId) =>
          db
            .selectDistinct({
              id: menus.id,
              parentId: menus.parentId,
              path: menus.path,
              name: menus.name,
              title: menus.title,
              icon: menus.icon,
              hide: menus.hide,
              component: menus.component,
              redirect: menus.redirect,
              authMark: menus.authMark,
              type: menus.type,
              keepAlive: menus.keepAlive,
              fixedTab: menus.fixedTab,
              sort: menus.sort
            })
            .from(roleMenus)
            .innerJoin(menus, eq(roleMenus.menuId, menus.id))
            .where(eq(roleMenus.roleId, roleId))
        )
      )
      for (const list of additional) menuRows.push(...list)
    }

    const deduped = Array.from(new Map(menuRows.map((m) => [m.id, m])).values())
    deduped.sort((a, b) => a.sort - b.sort)

    return buildTree(deduped)
  }

  static async listAll(): Promise<AppRouteRecord[]> {
    const rows = await db
      .select({
        id: menus.id,
        parentId: menus.parentId,
        path: menus.path,
        name: menus.name,
        title: menus.title,
        icon: menus.icon,
        hide: menus.hide,
        component: menus.component,
        redirect: menus.redirect,
        authMark: menus.authMark,
        type: menus.type,
        keepAlive: menus.keepAlive,
        fixedTab: menus.fixedTab,
        sort: menus.sort
      })
      .from(menus)
      .orderBy(asc(menus.sort))

    return buildTree(rows)
  }
}
