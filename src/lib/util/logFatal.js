const chalk = require('chalk')

const log = {
  // note: you can also just `throw` to do this
  async fatal(message) {
    console.error(chalk`{bgRed [fatal]} ${message}`)

    process.exit(1) // fatal errors only!
  },
}

module.exports = { log }
