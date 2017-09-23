const { log } = require('./util/logFatal')

const fs = require('mz/fs')
const memize = require('memize')
const chalk = require('chalk')

const getOptions = memize(async function(configFile = 'env.json') {
  try {
    return JSON.parse(await fs.readFile(configFile, 'utf8'))
  } catch(err) {
    // for some reason the await above swallowed the error
    await log.fatal(err)
  }
})

async function env(key, type, defaultValue = null) {
  if (!key) throw 'env(key) expected'
  if (!type) throw 'env(, type) expected'

  const environment = await getOptions()
  let value = environment[key]

  if (!value && defaultValue !== null)
    value = defaultValue

  if (typeof value === 'undefined') {
    await log.fatal(chalk`Environment option expected but not provided: {yellow ${key}} {dim (${type})}`)
  }

  if (typeof value !== type) {
    await log.fatal(chalk`Environment option {yellow ${key}} should be {cyan ${type}} but it is {cyan ${typeof value}}`)
  }

  return value
}

module.exports = { env, getOptions }
