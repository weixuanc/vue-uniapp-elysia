import { and, asc, count, eq, like, or, type SQL } from 'drizzle-orm'
import { db } from '../../config/database'
import { userRoles, users, roles } from '../../database/schema'
import { notFound, unauthorized } from '../../utils/error'
import type { UserListQuery } from './model'

export interface UserInfo {
  userId: number
  userName: string
  nickName?: string | null
  email?: string | null
  avatar?: string | null
  roles: string[]
  buttons: string[]
}

export interface UserListItem {
  id: number
  avatar: string
  status: string
  userName: string
  userGender: string
  nickName: string
  userPhone: string
  userEmail: string
  userRoles: string[]
  createBy: string
  createTime: string
  updateBy: string
  updateTime: string
}

export interface UserListResult {
  records: UserListItem[]
  current: number
  size: number
  total: number
}

export abstract class UserService {
  static async getInfo(userId: number): Promise<UserInfo> {
    const found = await db
      .select({
        id: users.id,
        userName: users.userName,
        nickName: users.nickName,
        email: users.email,
        avatar: users.avatar,
        status: users.status
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const user = found[0]
    if (!user) throw notFound('用户不存在')

    const roleRows = await db
      .select({ roleCode: roles.roleCode, roleName: roles.roleName })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    const roleCodes = roleRows.map((r) => r.roleCode)

    return {
      userId: user.id,
      userName: user.userName,
      nickName: user.nickName,
      email: user.email ?? '',
      avatar: user.avatar ?? '',
      roles: roleCodes,
      buttons: roleCodes.flatMap((code) => [`${code}:add`, `${code}:edit`, `${code}:delete`])
    }
  }

  static async list(query: UserListQuery): Promise<UserListResult> {
    const current = query.current ?? 1
    const size = query.size ?? 20

    const filters: SQL[] = []
    if (query.id !== undefined) filters.push(eq(users.id, query.id))
    if (query.userName)
      filters.push(like(users.userName, `%${query.userName}%`))
    if (query.userGender)
      filters.push(eq(users.gender, query.userGender))
    if (query.userPhone) filters.push(like(users.phone, `%${query.userPhone}%`))
    if (query.userEmail) filters.push(like(users.email, `%${query.userEmail}%`))
    if (query.status) filters.push(eq(users.status, query.status))

    const where = filters.length > 0 ? and(...filters) : undefined

    const [totalRow, rows] = await Promise.all([
      db.select({ value: count() }).from(users).where(where),
      db
        .select({
          id: users.id,
          userName: users.userName,
          nickName: users.nickName,
          avatar: users.avatar,
          email: users.email,
          phone: users.phone,
          gender: users.gender,
          status: users.status,
          createBy: users.createBy,
          updateBy: users.updateBy,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(where)
        .orderBy(asc(users.id))
        .limit(size)
        .offset((current - 1) * size)
    ])

    const total = totalRow[0]?.value ?? 0

    const userIds = rows.map((r) => r.id)
    const userRoleMap = new Map<number, string[]>()

    if (userIds.length > 0) {
      const roleRows = await db
        .select({
          userId: userRoles.userId,
          roleName: roles.roleName
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(or(...userIds.map((id) => eq(userRoles.userId, id)))!)

      for (const r of roleRows) {
        const list = userRoleMap.get(r.userId) ?? []
        list.push(r.roleName)
        userRoleMap.set(r.userId, list)
      }
    }

    const records: UserListItem[] = rows.map((r) => ({
      id: r.id,
      avatar: r.avatar ?? '',
      status: r.status,
      userName: r.userName,
      userGender: r.gender,
      nickName: r.nickName ?? '',
      userPhone: r.phone ?? '',
      userEmail: r.email ?? '',
      userRoles: userRoleMap.get(r.id) ?? [],
      createBy: r.createBy,
      createTime: r.createdAt.toISOString(),
      updateBy: r.updateBy,
      updateTime: r.updatedAt.toISOString()
    }))

    return {
      records,
      current,
      size,
      total
    }
  }
}
