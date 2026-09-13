import { t } from 'elysia'

export const roleModel = {
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
    roleId: t.Optional(
      t.Integer({
        title: '角色ID',
        description: '角色主键ID,用于精确查询'
      })
    ),
    roleName: t.Optional(
      t.String({
        title: '角色名称',
        description: '角色展示名称,支持模糊匹配'
      })
    ),
    roleCode: t.Optional(
      t.String({
        title: '角色编码',
        description: '角色权限编码,用于权限校验'
      })
    ),
    description: t.Optional(
      t.String({
        title: '角色描述',
        description: '角色备注说明'
      })
    ),
    enabled: t.Optional(
      t.Boolean({
        title: '是否启用',
        description: '角色启用状态'
      })
    ),
    startTime: t.Optional(
      t.Union(
        [t.String({ title: '开始时间', description: '筛选开始时间' }), t.Null()],
        { title: '开始时间', description: '筛选开始时间' }
      )
    ),
    endTime: t.Optional(
      t.Union(
        [t.String({ title: '结束时间', description: '筛选结束时间' }), t.Null()],
        { title: '结束时间', description: '筛选结束时间' }
      )
    )
  })
}

export type RoleListQuery = typeof roleModel.listQuery.static