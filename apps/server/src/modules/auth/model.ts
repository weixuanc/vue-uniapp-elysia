import { t } from 'elysia'

export const authModel = {
  login: t.Object({
    userName: t.String({
      title: '用户名',
      description: '用户登录账号',
      minLength: 1,
      maxLength: 64
    }),
    password: t.String({
      title: '密码',
      description: '用户登录密码',
      minLength: 1,
      maxLength: 255
    })
  })
}

export type LoginBody = typeof authModel.login.static