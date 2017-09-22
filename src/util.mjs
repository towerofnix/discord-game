import chalk from 'chalk'
import util from 'util'

export const log = {
  // TODO loglevel opts?
  info(message) {
    console.log(chalk`{blue [info]} ${message}`)
  },

  success(message) {
    console.log(chalk`{green [success]} ${message}`)
  },

  warn(message) {
    console.error(chalk`{yellow [warn]} ${message}`)
  },

  fatal(message) {
    console.error(chalk`{bgRed [fatal]} ${message}`)
  },

  inspect(object, opts = {}) {
    console.log(util.inspect(object, Object.assign({
      depth: null,
      colors: true,
    }, opts)))
  }
}
