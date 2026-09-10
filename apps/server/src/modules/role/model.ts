import { t } from 'elysia'

export const roleModel = {
  listQuery: t.Object({
    current: t.Optional(t.Integer({ minimum: 1, default: 1 })),
    size: t.Optional(t.Integer({ minimum: 1, maximum: 200, default: 20 })),
    roleId: t.Optional(t.Integer()),
    roleName: t.Optional(t.String()),
    roleCode: t.Optional(t.String()),
    description: t.Optional(t.String()),
    enabled: t.Optional(t.Boolean()),
    startTime: t.Optional(t.Union([t.String(), t.Null()])),
    endTime: t.Optional(t.Union([t.String(), t.Null()]))
  })
}

export type RoleListQuery = typeof roleModel.listQuery.static
