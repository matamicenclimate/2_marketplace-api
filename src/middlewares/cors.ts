import Koa from 'koa'
export async function cors(ctx: Koa.Context, next: Koa.Next) {
  ctx.res.setHeader('Access-Control-Allow-Origin', '*')
  ctx.res.setHeader('Access-Control-Allow-Methods', '*')
  ctx.res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  await next()
}

