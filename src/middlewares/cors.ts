import { Context, Next } from "koa"

export function cors (ctx: Context, next: Next) {
  ctx.res.header('Access-Control-Allow-Origin', '*')
  ctx.res.header('Access-Control-Allow-Methods', '*')
  ctx.res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
}

