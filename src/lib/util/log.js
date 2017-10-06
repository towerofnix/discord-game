const chalk = require('chalk')
const { env } = require('../env')
const nodeUtil = require('util')

const log = {
  async info(...messages) {
    if (await env('loglevel', 'number', 0) > 0) return

    console.log(chalk`{blue [info]} ${messages.join(', ')}`)
  },

  async success(...messages) {
    if (await env('loglevel', 'number', 0) > 1) return

    console.log(chalk`{green [success]} ${messages.join(', ')}`)
  },

  async warn(...messages) {
    if (await env('loglevel', 'number', 0) > 2) return

    console.error(chalk`{yellow [warn]} ${messages.join(', ')}`)
  },

  // fatal() is defined in logFatal.js

  async debug(...messages) {
    if (await env('loglevel', 'number', 0) > -1) return

    console.log(chalk`{dim [debug]} ${messages.join(', ')}`)
  },

  async inspect(...objects) {
    if (await env('loglevel', 'number', 0) > -1) return

    process.stdout.write(chalk`{dim [inspect]} `)

    for (let object of objects) {
      console.log(nodeUtil.inspect(object, {
        depth: null,
        colors: true,
      }))
    }
  }
}

module.exports = { log }
