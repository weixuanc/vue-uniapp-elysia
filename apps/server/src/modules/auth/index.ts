import { Elysia } from 'elysia'
import { authModel } from './model'
import { AuthService } from './service'
import { ok } from '../../utils/response'
import { authJwt } from '../../utils/jwt'

export const auth = new Elysia({
  name: 'auth',
  prefix: '/api/auth',
  tags: ['auth']
})
  .use(authJwt)
  .post(
    '/login',
    async ({ body, jwt }) => {
      const result = await AuthService.login(body, jwt)
      return ok(result, '登录成功')
    },
    {
      body: authModel.login
    }
  )
