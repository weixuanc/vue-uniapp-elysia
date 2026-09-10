import jwt from '@elysiajs/jwt'
import { config } from '../config'
import { unauthorized } from './error'

export interface JwtPayload {
  sub: number
  userName: string
  type: 'access' | 'refresh'
  exp?: number
  iat?: number
}

export const authJwt = jwt({
  secret: config.jwt.secret,
  exp: config.jwt.accessExpiresIn
})

export const extractToken = (authorization: string | null | undefined): string => {
  if (!authorization) throw unauthorized('缺少访问令牌')
  const trimmed = authorization.trim()
  return trimmed.startsWith('Bearer ')
    ? trimmed.slice(7).trim()
    : trimmed
}

export const requireAuth = async (
  jwtInstance: {
    verify: (token?: string) => Promise<unknown>
  },
  authorization: string | null | undefined
): Promise<JwtPayload> => {
  const token = extractToken(authorization)
  const payload = (await jwtInstance.verify(token)) as JwtPayload | false
  if (!payload || typeof payload !== 'object') {
    throw unauthorized('无效的访问令牌')
  }
  return payload
}
