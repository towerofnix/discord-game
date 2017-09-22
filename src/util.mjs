import chalk from 'chalk'
import util from 'util'
import env from './env'

export const log = {
  // TODO loglevel opts?
  info(message) {
    if (env('loglevel', 'number') > 0)

    console.log(chalk`{blue [info]} ${message}`)
  },

  success(message) {
    if (env('loglevel', 'number') > 1) return

    console.log(chalk`{green [success]} ${message}`)
  },

  warn(message) {
    if (env('loglevel', 'number') > 2) return

    console.error(chalk`{yellow [warn]} ${message}`)
  },

  fatal(message) {
    console.error(chalk`{bgRed [fatal]} ${message}`)
  },

  inspect(object, opts = {}) {
    if (env('loglevel', 'number') > -1) return

    console.log(util.inspect(object, Object.assign({
      depth: null,
      colors: true,
    }, opts)))
  }
}
