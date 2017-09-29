const { Game } = require('./lib/Game')
const { log, checkTypes } = require('./lib/util')
const { LonelyVoid } = require('./game/rooms/LonelyVoid')
const { TinyLand } = require('./game/rooms/TinyLand')
const enemies = require('./game/enemies')
const moves = require('./game/moves')

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

  for (const category of Object.values(moves)) {
    for (const move of category) {
      await game.moves.register(new move(game))
    }
  }

  for (const enemyClass of enemies) {
    await game.enemies.register(new enemyClass(game))
  }

  await game.go()
}

module.exports = { main }

if (require.main === module) {
  main()
}
