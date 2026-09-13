import cors from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { config } from './config'
import { bootstrap } from './database/bootstrap'
import { auth } from './modules/auth'
import { user } from './modules/user'
import { role } from './modules/role'
import { menu } from './modules/menu'
import { HttpError } from './utils/error'
import { ApiCode, ok } from './utils/response'

const app = new Elysia({ name: 'app' })
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: '能耗管理系统 API',
          version: '1.0.50',
          description: '能耗管理系统后端接口文档'
        },
        tags: [
          { name: 'auth', description: '认证授权接口' },
          { name: 'user', description: '用户管理接口' },
          { name: 'role', description: '角色管理接口' },
          { name: 'menu', description: '菜单管理接口' }
        ]
      }
    })
  )
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 200
      return {
        code: ApiCode.error,
        msg: '参数校验失败',
        data: error.all ?? error.message
      }
    }
    if (error instanceof HttpError) {
      if (error.httpStatus !== 200) set.status = error.httpStatus
      return {
        code: error.code,
        msg: error.message,
        data: null
      }
    }
    console.error('[Server Error]', error)
    set.status = 200
    const fallbackMessage =
      error instanceof Error ? error.message : '服务器内部错误'
    return {
      code: ApiCode.internalServerError,
      msg: fallbackMessage,
      data: null
    }
  })
  .get('/', () => ok({ name: 'energy2iot-server', status: 'running' }))
  .get('/health', () => ok({ status: 'ok' }))
  .use(auth)
  .use(user)
  .use(role)
  .use(menu)

const start = async () => {
  try {
    await bootstrap()
    console.log('[bootstrap] database ready')
  } catch (err) {
    console.error('[bootstrap] failed', err)
    process.exit(1)
  }

  app.listen(config.port)
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  )
  console.log(`📚 OpenAPI docs: http://${app.server?.hostname}:${app.server?.port}/swagger`)
}

start()
