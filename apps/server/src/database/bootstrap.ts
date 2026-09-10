import { sql } from 'drizzle-orm'
import { db } from '../config/database'
import { hashPassword } from '../utils/password'

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(64) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nick_name VARCHAR(64),
    avatar TEXT,
    email VARCHAR(128),
    phone VARCHAR(32),
    gender VARCHAR(16) DEFAULT 'unknown' NOT NULL,
    status VARCHAR(16) DEFAULT '1' NOT NULL,
    remark TEXT,
    create_by VARCHAR(64) DEFAULT 'system' NOT NULL,
    update_by VARCHAR(64) DEFAULT 'system' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_user_name_idx ON users (user_name)`,

  `CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(64) NOT NULL,
    role_code VARCHAR(64) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS roles_role_code_idx ON roles (role_code)`,

  `CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER DEFAULT 0 NOT NULL,
    path VARCHAR(255) NOT NULL,
    name VARCHAR(64) NOT NULL,
    title VARCHAR(64) NOT NULL,
    icon VARCHAR(64),
    sort INTEGER DEFAULT 0 NOT NULL,
    hide BOOLEAN DEFAULT FALSE NOT NULL,
    component VARCHAR(255),
    redirect VARCHAR(255),
    auth_mark VARCHAR(128),
    type VARCHAR(16) DEFAULT 'menu' NOT NULL,
    keep_alive BOOLEAN DEFAULT FALSE NOT NULL,
    fixed_tab BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_idx ON user_roles (user_id, role_id)`,

  `CREATE TABLE IF NOT EXISTS role_menus (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS role_menus_role_menu_idx ON role_menus (role_id, menu_id)`
]

const SEED_MENUS: Array<{
  id: number
  parentId: number
  path: string
  name: string
  title: string
  icon?: string
  sort: number
  hide?: boolean
  component?: string
  redirect?: string
  authMark?: string
  type?: string
}> = [
  { id: 1, parentId: 0, path: '/dashboard', name: 'Dashboard', title: '仪表盘', icon: 'home', sort: 1, component: 'home/index' },
  { id: 2, parentId: 0, path: '/system', name: 'System', title: '系统管理', icon: 'setting', sort: 99, redirect: '/system/user' },
  { id: 21, parentId: 2, path: '/system/user', name: 'SystemUser', title: '用户管理', icon: 'user', sort: 1, component: 'system/user/index', authMark: 'system:user:list' },
  { id: 22, parentId: 2, path: '/system/role', name: 'SystemRole', title: '角色管理', icon: 'role', sort: 2, component: 'system/role/index', authMark: 'system:role:list' },
  { id: 23, parentId: 2, path: '/system/menu', name: 'SystemMenu', title: '菜单管理', icon: 'menu', sort: 3, component: 'system/menu/index', authMark: 'system:menu:list' }
]

const SEED_ROLES: Array<{ id: number; roleName: string; roleCode: string; description: string }> = [
  { id: 1, roleName: '超级管理员', roleCode: 'admin', description: '拥有所有权限' },
  { id: 2, roleName: '普通用户', roleCode: 'user', description: '基础查看权限' }
]

export const bootstrap = async (): Promise<void> => {
  for (const stmt of DDL) {
    await db.execute(sql.raw(stmt))
  }

  const existingRoles = (await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM roles`
  )) as unknown as Array<{ count: string }>
  const roleCount = Number(existingRoles[0]?.count ?? 0)

  if (roleCount === 0) {
    for (const r of SEED_ROLES) {
      await db.execute(
        sql`INSERT INTO roles (id, role_name, role_code, description, enabled)
            VALUES (${r.id}, ${r.roleName}, ${r.roleCode}, ${r.description}, TRUE)`
      )
    }
  }

  const existingMenus = (await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM menus`
  )) as unknown as Array<{ count: string }>
  const menuCount = Number(existingMenus[0]?.count ?? 0)

  if (menuCount === 0) {
    for (const m of SEED_MENUS) {
      await db.execute(
        sql`INSERT INTO menus (id, parent_id, path, name, title, icon, sort, hide, component, redirect, auth_mark, type)
            VALUES (${m.id}, ${m.parentId}, ${m.path}, ${m.name}, ${m.title},
                    ${m.icon ?? null}, ${m.sort}, ${m.hide ?? false},
                    ${m.component ?? null}, ${m.redirect ?? null},
                    ${m.authMark ?? null}, ${m.type ?? 'menu'})`
      )
    }

    for (const menuId of [1, 2, 21, 22, 23]) {
      await db.execute(
        sql`INSERT INTO role_menus (role_id, menu_id) VALUES (1, ${menuId})`
      )
    }

    await db.execute(
      sql`INSERT INTO role_menus (role_id, menu_id) VALUES (2, 1)`
    )
  }

  const existingUsers = (await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM users`
  )) as unknown as Array<{ count: string }>
  const userCount = Number(existingUsers[0]?.count ?? 0)

  if (userCount === 0) {
    const adminHash = await hashPassword('admin123')
    const userHash = await hashPassword('user123')

    await db.execute(
      sql`INSERT INTO users (user_name, password, nick_name, email, phone, gender, status, create_by, update_by)
          VALUES ('admin', ${adminHash}, '超级管理员', 'admin@energy2iot.local', '13800000000', 'male', '1', 'system', 'system')`
    )
    await db.execute(
      sql`INSERT INTO users (user_name, password, nick_name, email, phone, gender, status, create_by, update_by)
          VALUES ('user', ${userHash}, '普通用户', 'user@energy2iot.local', '13800000001', 'female', '1', 'system', 'system')`
    )

    const adminRows = (await db.execute<{ id: number }>(
      sql`SELECT id FROM users WHERE user_name = 'admin' LIMIT 1`
    )) as unknown as Array<{ id: number }>
    const userRows = (await db.execute<{ id: number }>(
      sql`SELECT id FROM users WHERE user_name = 'user' LIMIT 1`
    )) as unknown as Array<{ id: number }>

    const adminId = adminRows[0]?.id
    const userId = userRows[0]?.id
    if (adminId !== undefined) {
      await db.execute(
        sql`INSERT INTO user_roles (user_id, role_id) VALUES (${adminId}, 1)`
      )
    }
    if (userId !== undefined) {
      await db.execute(
        sql`INSERT INTO user_roles (user_id, role_id) VALUES (${userId}, 2)`
      )
    }
  }
}
