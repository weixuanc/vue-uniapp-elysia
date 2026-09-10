import { t } from 'elysia'

export const userModel = {
  listQuery: t.Object({
    current: t.Optional(t.Integer({ minimum: 1, default: 1 })),
    size: t.Optional(t.Integer({ minimum: 1, maximum: 200, default: 20 })),
    id: t.Optional(t.Integer()),
    userName: t.Optional(t.String()),
    userGender: t.Optional(t.String()),
    userPhone: t.Optional(t.String()),
    userEmail: t.Optional(t.String()),
    status: t.Optional(t.String())
  })
}

export type UserListQuery = typeof userModel.listQuery.static
