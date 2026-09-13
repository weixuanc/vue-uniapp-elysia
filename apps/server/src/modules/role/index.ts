import { Elysia } from 'elysia'
import { roleModel } from './model'
import { RoleService } from './service'
import { ok } from '../../utils/response'
import { authJwt, requireAuth } from '../../utils/jwt'

export const role = new Elysia({
  name: 'role',
  prefix: '/api/role',
  tags: ['role']
})
  .use(authJwt)
  .get(
    '/list',
    async ({ jwt, request, query }) => {
      await requireAuth(jwt, request.headers.get('authorization'))
      const result = await RoleService.list(query)
      return ok(result)
    },
    {
      query: roleModel.listQuery
    }
  )
