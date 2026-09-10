import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    userName: varchar('user_name', { length: 64 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    nickName: varchar('nick_name', { length: 64 }),
    avatar: text('avatar'),
    email: varchar('email', { length: 128 }),
    phone: varchar('phone', { length: 32 }),
    gender: varchar('gender', { length: 16 }).default('unknown').notNull(),
    status: varchar('status', { length: 16 }).default('1').notNull(),
    remark: text('remark'),
    createBy: varchar('create_by', { length: 64 }).default('system').notNull(),
    updateBy: varchar('update_by', { length: 64 }).default('system').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (t) => ({
    userNameIdx: uniqueIndex('users_user_name_idx').on(t.userName)
  })
)

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    roleName: varchar('role_name', { length: 64 }).notNull(),
    roleCode: varchar('role_code', { length: 64 }).notNull(),
    description: text('description'),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (t) => ({
    roleCodeIdx: uniqueIndex('roles_role_code_idx').on(t.roleCode)
  })
)

export const menus = pgTable('menus', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').default(0).notNull(),
  path: varchar('path', { length: 255 }).notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  title: varchar('title', { length: 64 }).notNull(),
  icon: varchar('icon', { length: 64 }),
  sort: integer('sort').default(0).notNull(),
  hide: boolean('hide').default(false).notNull(),
  component: varchar('component', { length: 255 }),
  redirect: varchar('redirect', { length: 255 }),
  authMark: varchar('auth_mark', { length: 128 }),
  type: varchar('type', { length: 16 }).default('menu').notNull(),
  keepAlive: boolean('keep_alive').default(false).notNull(),
  fixedTab: boolean('fixed_tab').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()
})

export const userRoles = pgTable(
  'user_roles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    userRoleIdx: uniqueIndex('user_roles_user_role_idx').on(t.userId, t.roleId)
  })
)

export const roleMenus = pgTable(
  'role_menus',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    roleMenuIdx: uniqueIndex('role_menus_role_menu_idx').on(t.roleId, t.menuId)
  })
)

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles)
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  roleMenus: many(roleMenus)
}))

export const menusRelations = relations(menus, ({ many }) => ({
  roleMenus: many(roleMenus)
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] })
}))

export const roleMenusRelations = relations(roleMenus, ({ one }) => ({
  role: one(roles, { fields: [roleMenus.roleId], references: [roles.id] }),
  menu: one(menus, { fields: [roleMenus.menuId], references: [menus.id] })
}))

export const table = {
  users,
  roles,
  menus,
  userRoles,
  roleMenus
}

export type Table = typeof table
