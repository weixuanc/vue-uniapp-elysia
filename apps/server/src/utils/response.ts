export enum ApiCode {
  success = 200,
  error = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  internalServerError = 500
}

export interface BaseResponse<T = unknown> {
  code: ApiCode
  msg: string
  data: T
}

export const ok = <T>(data: T, msg = 'success'): BaseResponse<T> => ({
  code: ApiCode.success,
  msg,
  data
})

export const fail = (
  msg: string,
  code: ApiCode = ApiCode.error,
  data: unknown = null
): BaseResponse => ({
  code,
  msg,
  data
})
