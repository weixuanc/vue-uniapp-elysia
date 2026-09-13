import { Elysia } from 'elysia'
import { MenuService } from './service'
import { ok } from '../../utils/response'
import { authJwt, requireAuth } from '../../utils/jwt'

export const menu = new Elysia({
  name: 'menu',
  prefix: '/api/v3/system/menus',
  tags: ['menu']
})
  .use(authJwt)
  .get('/simple', async ({ jwt, request }) => {
    const payload = await requireAuth(jwt, request.headers.get('authorization'))
    const menus = await MenuService.listByUser(Number(payload.sub))
    return ok(menus)
  })
