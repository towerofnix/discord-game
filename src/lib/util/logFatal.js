const chalk = require('chalk')

const log = {
  // note: you can also just `throw` to do this
  async fatal(...messages) {
    console.error(chalk`{bgRed [fatal]} ${messages.join(', ')}`)

    process.exit(1) // fatal errors only!
  },
}

module.exports = { log }
