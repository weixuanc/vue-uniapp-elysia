import jwt, { type JWTPayloadInput } from '@elysiajs/jwt'
import { config } from '../config'
import { unauthorized } from './error'

export interface JwtPayload {
  sub: string
  userName: string
  type: 'access' | 'refresh'
  exp?: number
  iat?: number
}

type ClaimValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClaimValue[]
  | { [key: string]: ClaimValue }

export interface JwtInstance {
  sign: (
    signValue: Omit<Record<string, ClaimValue>, 'nbf' | 'exp' | 'iat'> & JWTPayloadInput
  ) => Promise<string>
  verify: (token?: string) => Promise<unknown>
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
  jwtInstance: JwtInstance,
  authorization: string | null | undefined
): Promise<JwtPayload> => {
  const token = extractToken(authorization)
  const payload = (await jwtInstance.verify(token)) as JwtPayload | false
  if (!payload || typeof payload !== 'object') {
    throw unauthorized('无效的访问令牌')
  }
  return payload
}
