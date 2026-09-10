export class HttpError extends Error {
  constructor(
    message: string,
    public readonly code: number = 400,
    public readonly httpStatus: number = 200
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const unauthorized = (msg = 'Unauthorized'): HttpError =>
  new HttpError(msg, 401, 401)

export const forbidden = (msg = 'Forbidden'): HttpError => new HttpError(msg, 403, 403)

export const notFound = (msg = 'Not Found'): HttpError => new HttpError(msg, 404, 404)

export const badRequest = (msg = 'Bad Request'): HttpError =>
  new HttpError(msg, 400, 200)
