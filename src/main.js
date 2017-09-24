const { Game } = require('./lib/Game')
const { log } = require('./lib/util')
const { LonelyVoid } = require('./game/rooms/LonelyVoid')
const { TinyLand } = require('./game/rooms/TinyLand')

const Discord = require('discord.js')
const chalk = require('chalk')
const camo = require('camo')

async function main() {
  process.on('uncaughtException', async err => {
    await log.fatal(err)
  })

  process.on('unhandledRejection', async err => {
    await log.fatal(err.stack || err)
  })

  const game = new Game()
  await game.setup()
  await game.roomController.registerRoom(new LonelyVoid())
  await game.roomController.registerRoom(new TinyLand())
  await game.go()
}

module.exports = { main }

if (require.main === module) {
  main()
    .catch(err => console.error(err))
}
