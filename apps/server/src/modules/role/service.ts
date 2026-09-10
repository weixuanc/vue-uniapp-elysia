import { and, asc, count, eq, gte, like, lte, type SQL } from 'drizzle-orm'
import { db } from '../../config/database'
import { roles } from '../../database/schema'
import type { RoleListQuery } from './model'

export interface RoleListItem {
  roleId: number
  roleName: string
  roleCode: string
  description: string
  enabled: boolean
  createTime: string
}

export interface RoleListResult {
  records: RoleListItem[]
  current: number
  size: number
  total: number
}

export abstract class RoleService {
  static async list(query: RoleListQuery): Promise<RoleListResult> {
    const current = query.current ?? 1
    const size = query.size ?? 20

    const filters: SQL[] = []
    if (query.roleId !== undefined) filters.push(eq(roles.id, query.roleId))
    if (query.roleName) filters.push(like(roles.roleName, `%${query.roleName}%`))
    if (query.roleCode) filters.push(like(roles.roleCode, `%${query.roleCode}%`))
    if (query.description)
      filters.push(like(roles.description, `%${query.description}%`))
    if (query.enabled !== undefined) filters.push(eq(roles.enabled, query.enabled))
    if (query.startTime) filters.push(gte(roles.createdAt, new Date(query.startTime)))
    if (query.endTime) filters.push(lte(roles.createdAt, new Date(query.endTime)))

    const where = filters.length > 0 ? and(...filters) : undefined

    const [totalRow, rows] = await Promise.all([
      db.select({ value: count() }).from(roles).where(where),
      db
        .select({
          roleId: roles.id,
          roleName: roles.roleName,
          roleCode: roles.roleCode,
          description: roles.description,
          enabled: roles.enabled,
          createdAt: roles.createdAt
        })
        .from(roles)
        .where(where)
        .orderBy(asc(roles.id))
        .limit(size)
        .offset((current - 1) * size)
    ])

    const total = totalRow[0]?.value ?? 0

    const records: RoleListItem[] = rows.map((r) => ({
      roleId: r.roleId,
      roleName: r.roleName,
      roleCode: r.roleCode,
      description: r.description ?? '',
      enabled: r.enabled,
      createTime: r.createdAt.toISOString()
    }))

    return {
      records,
      current,
      size,
      total
    }
  }
}
