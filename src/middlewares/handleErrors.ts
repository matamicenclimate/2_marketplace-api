import * as Application from 'koa'
import { customError } from '../infrastructure/errors'

export async function handleErrors(
  ctx: Application.Context,
  next: Application.Next
) {
  try {
    await next()
  } catch (error) {
    ctx.status = error.statusCode || 500
    ctx.body = customError(error)
    return
  }
  if (ctx.body == null) {
    ctx.status = 404
    ctx.body = {
      message: 'Not found',
    }
  }
}