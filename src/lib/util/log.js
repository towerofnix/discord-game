const chalk = require('chalk')
const { env } = require('../env')

const log = {
  async info(message) {
    if (await env('loglevel', 'number', 0) > 0) return

    console.log(chalk`{blue [info]} ${message}`)
  },

  async success(message) {
    if (await env('loglevel', 'number', 0) > 1) return

    console.log(chalk`{green [success]} ${message}`)
  },

  async warn(message) {
    if (await env('loglevel', 'number', 0) > 2) return

    console.error(chalk`{yellow [warn]} ${message}`)
  },

  // fatal() is defined in logFatal.js

  async inspect(object, opts = {}) {
    if (await env('loglevel', 'number', 0) > -1) return

    console.log(util.inspect(object, Object.assign({
      depth: null,
      colors: true,
    }, opts)))
  }
}

module.exports = { log }
