import { eq } from 'drizzle-orm'
import { db } from '../../config/database'
import { users } from '../../database/schema'
import { verifyPassword } from '../../utils/password'
import { badRequest, unauthorized } from '../../utils/error'
import type { JwtInstance } from '../../utils/jwt'
import { config } from '../../config'
import type { LoginBody } from './model'

export interface LoginResult {
  token: string
  refreshToken: string
}

export abstract class AuthService {
  static async login(body: LoginBody, jwt: JwtInstance): Promise<LoginResult> {
    if (!body.userName || !body.password) {
      throw badRequest('userName and password are required')
    }

    const found = await db
      .select({
        id: users.id,
        userName: users.userName,
        password: users.password,
        status: users.status
      })
      .from(users)
      .where(eq(users.userName, body.userName))
      .limit(1)

    const user = found[0]
    if (!user) throw unauthorized('用户名或密码错误')

    if (user.status !== '1') throw unauthorized('账号已被停用')

    const matched = await verifyPassword(body.password, user.password)
    if (!matched) throw unauthorized('用户名或密码错误')

    const [token, refreshToken] = await Promise.all([
      jwt.sign({
        sub: String(user.id),
        userName: user.userName,
        type: 'access',
        exp: config.jwt.accessExpiresIn
      }),
      jwt.sign({
        sub: String(user.id),
        userName: user.userName,
        type: 'refresh',
        exp: config.jwt.refreshExpiresIn
      })
    ])

    return { token, refreshToken }
  }
}
