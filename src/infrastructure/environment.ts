const assert = require('assert')
const path = require('path')

const environmentVariablesToAssert = (): void => {
  assertVariable(process.env.NODE_ENV, 'NODE_ENV')
  assertVariable(process.env.RESTAPI_PORT, 'RESTAPI_PORT')
  assertVariable(process.env.RESTAPI_VERSION, 'RESTAPI_VERSION')
}

const checkEnvVars = (): void => {
  try {
    environmentVariablesToAssert()
  } catch (error) {
    throw new Error(error.message)
  }
}

const loadEnvVars = (): void => {
  const location = path.join(__dirname, '/../../.env')
  require('dotenv').config({ path: location })

  checkEnvVars()
}

const assertVariable = (variable: string | null | undefined, name: string) => {
  if (variable == null) {
    throw new Error(`Variable ${name} is undefined!`)
  }
  if (variable === '') {
    throw new Error(`Variable ${name} is empty!`)
  }
}

export { loadEnvVars }
