const { Game } = require('./lib/Game')
const { log, checkTypes } = require('./lib/util')
const { LonelyVoid } = require('./game/rooms/LonelyVoid')
const { TinyLand } = require('./game/rooms/TinyLand')

async function main() {
  process.on('uncaughtException', async err => {
    await log.fatal(err.stack || err)
  })

  process.on('unhandledRejection', async err => {
    await log.fatal(err.stack || err)
  })

  const game = new Game()
  await game.setup()
  await game.rooms.register(new LonelyVoid(game))
  await game.rooms.register(new TinyLand(game))
  await game.go()
}

module.exports = { main }

if (require.main === module) {
  main()
}
