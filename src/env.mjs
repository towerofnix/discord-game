import fs from 'mz/fs'
import memize from 'memize'
import chalk from 'chalk'
import { log } from './util'

async function getOptions() {
  // TODO await fs.readFile some config file
  return {}
}

export const all = memize(getOptions)
export default async function env(key, type, defaultValue = null) {
  if (!key) throw 'env(key) expected'
  if (!type) throw 'env(, type) expected'

  const environment = all()
  let value = environment[key]

  if (!value && defaultValue !== null)
    value = defaultValue

  if (!value) {
    log.fatal(chalk`Configuration option expected but not provided: {yellow ${key}} {dim (${type})}`)
    process.exit(1)
  }

  if (typeof value !== type) {
    log.fatal(chalk`Configuration option {yellow ${key}} should be {cyan ${type} but it is {cyan ${typeof value}`)
    process.exit(1)
  }

  return value
}
