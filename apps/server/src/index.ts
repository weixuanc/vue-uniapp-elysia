import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { config } from './config'
import { bootstrap } from './database/bootstrap'
import { authController } from './modules/auth'
import { userController } from './modules/user'
import { roleController } from './modules/role'
import { menuController } from './modules/menu'
import { HttpError } from './utils/error'
import { ApiCode, ok } from './utils/response'

const app = new Elysia({ name: 'app' })
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
    return {
      code: ApiCode.internalServerError,
      msg: error.message || '服务器内部错误',
      data: null
    }
  })
  .get('/', () => ok({ name: 'energy2iot-server', status: 'running' }))
  .get('/health', () => ok({ status: 'ok' }))
  .use(authController)
  .use(userController)
  .use(roleController)
  .use(menuController)

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
}

start()
