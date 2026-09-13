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
import { logger } from './utils/logger'
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
  .onRequest(({ request }) => {
    logger.http.info('request', {
      method: request.method,
      url: request.url
    })
  })
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      logger.app.warn('validation failed', { detail: error.all ?? error.message })
      set.status = 200
      return {
        code: ApiCode.error,
        msg: '参数校验失败',
        data: error.all ?? error.message
      }
    }
    if (error instanceof HttpError) {
      if (error.httpStatus !== 200) set.status = error.httpStatus
      logger.app.warn('http error', {
        code: error.code,
        httpStatus: error.httpStatus,
        message: error.message
      })
      return {
        code: error.code,
        msg: error.message,
        data: null
      }
    }
    logger.app.error('server error', { err: error })
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
    logger.bootstrap.info('database ready')
  } catch (err) {
    logger.bootstrap.error('bootstrap failed', { err })
    process.exit(1)
  }

  app.listen(config.port)
  const host = app.server?.hostname
  const port = app.server?.port
  logger.app.info(`Elysia is running at ${host}:${port}`)
  logger.app.info(`OpenAPI docs: http://${host}:${port}/swagger`)
}

start()