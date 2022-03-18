process.env.NODE_ENV = 'testing'
process.env.RESTAPI_PORT = '4000'
import Main from '../../src/Main'

const { app } = Main.setup()
export default app.listen()
