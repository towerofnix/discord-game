import fs from 'fs'
import { promisify } from 'util'
import memize from 'memize'
import chalk from 'chalk'

const readFile = promisify(fs.readFile)

export const getOptions = memize(async function(configFile = 'env.json') {
  return JSON.parse(await readFile(configFile, 'utf8'))
})

export default async function env(key, type, defaultValue = null) {
  if (!key) throw 'env(key) expected'
  if (!type) throw 'env(, type) expected'

  const environment = await getOptions()
  let value = environment[key]

  if (!value && defaultValue !== null)
    value = defaultValue

  if (typeof value === 'undefined') {
    throw chalk`Environment option expected but not provided: {yellow ${key}} {dim (${type})}`
  }

  if (typeof value !== type) {
    throw chalk`Environment option {yellow ${key}} should be {cyan ${type}} but it is {cyan ${typeof value}}`
  }

  return value
}
