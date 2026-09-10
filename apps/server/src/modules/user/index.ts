import { Elysia } from 'elysia'
import { userModel } from './model'
import { UserService } from './service'
import { ok } from '../../utils/response'
import { authJwt, requireAuth } from '../../utils/jwt'

export const userController = new Elysia({
  prefix: '/api/user',
  tags: ['user']
})
  .use(authJwt)
  .get('/info', async ({ jwt, request }) => {
    const payload = await requireAuth(jwt, request.headers.get('authorization'))
    const info = await UserService.getInfo(payload.sub)
    return ok(info)
  })
  .get(
    '/list',
    async ({ jwt, request, query }) => {
      await requireAuth(jwt, request.headers.get('authorization'))
      const result = await UserService.list(query)
      return ok(result)
    },
    {
      query: userModel.listQuery
    }
  )
