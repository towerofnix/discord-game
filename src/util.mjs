import chalk from 'chalk'
import util from 'util'
import env from './env'

export const log = {
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
