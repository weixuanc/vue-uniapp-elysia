import { t } from 'elysia'

export const userModel = {
  listQuery: t.Object({
    current: t.Optional(
      t.Integer({
        title: '当前页码',
        description: '分页查询的当前页码,从 1 开始',
        minimum: 1,
        default: 1
      })
    ),
    size: t.Optional(
      t.Integer({
        title: '每页条数',
        description: '分页查询的每页返回条数',
        minimum: 1,
        maximum: 200,
        default: 20
      })
    ),
    id: t.Optional(
      t.Integer({
        title: '用户ID',
        description: '用户主键ID,用于精确查询'
      })
    ),
    userName: t.Optional(
      t.String({
        title: '用户名',
        description: '用户登录账号,支持模糊匹配'
      })
    ),
    userGender: t.Optional(
      t.String({
        title: '性别',
        description: '用户性别'
      })
    ),
    userPhone: t.Optional(
      t.String({
        title: '手机号',
        description: '用户手机号码'
      })
    ),
    userEmail: t.Optional(
      t.String({
        title: '邮箱',
        description: '用户邮箱地址'
      })
    ),
    status: t.Optional(
      t.String({
        title: '状态',
        description: '用户启用状态,例如启用 / 禁用'
      })
    )
  })
}

export type UserListQuery = typeof userModel.listQuery.static