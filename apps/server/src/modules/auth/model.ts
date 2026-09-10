import { t } from 'elysia'

export const authModel = {
  login: t.Object({
    userName: t.String({ minLength: 1, maxLength: 64 }),
    password: t.String({ minLength: 1, maxLength: 255 })
  })
}

export type LoginBody = typeof authModel.login.static
