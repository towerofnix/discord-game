const chalk = require('chalk')
const util = require('util')

const log = {
  async info(message) {
    // FIXME: Please never forgive me for this.
    // Just kidding; it's your fault.
    // -Florrie
    const { env } = require('./env')

    if (await env('loglevel', 'number', 0) > 0) return

    console.log(chalk`{blue [info]} ${message}`)
  },

  async success(message) {
    const { env } = require('./env')

    if (await env('loglevel', 'number', 0) > 1) return

    console.log(chalk`{green [success]} ${message}`)
  },

  async warn(message) {
    const { env } = require('./env')

    if (await env('loglevel', 'number', 0) > 2) return

    console.error(chalk`{yellow [warn]} ${message}`)
  },

  // note: you can also just `throw` to do this
  async fatal(message) {
    console.error(chalk`{bgRed [fatal]} ${message}`)

    process.exit(1) // fatal errors only!
  },

  async inspect(object, opts = {}) {
    if (await env('loglevel', 'number', 0) > -1) return

    console.log(util.inspect(object, Object.assign({
      depth: null,
      colors: true,
    }, opts)))
  }
}

module.exports = { log }
