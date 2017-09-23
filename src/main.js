const { Game } = require('./lib/Game')
const { log } = require('./lib/util')

const Discord = require('discord.js')
const chalk = require('chalk')
const camo = require('camo')

async function main() {
  process.on('uncaughtException', async err => {
    if (typeof err === 'object') await log.inspect(err) // only shows on -1 loglevel [debug]
    await log.fatal(err)
  })

  process.on('unhandledRejection', async err => {
    if (typeof err === 'object') await log.inspect(err) // only shows on -1 loglevel [debug]
    await log.fatal(err)
  })

  const game = new Game()
  await game.setup()
  await game.go()
}

module.exports = {main}

if (require.main === module) {
  main()
    .catch(err => console.error(err))
}
