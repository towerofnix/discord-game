//const { Game } = require('./lib/Game')
import Game from './lib/Game'
import { log, checkTypes } from './lib/util'
//const { LonelyVoid } = require('./game/rooms/LonelyVoid')
//const { TinyLand } = require('./game/rooms/TinyLand')
//const battleAIs = require('./game/ais')
//const music = require('./game/music')
//const moves = require('./game/moves')

console.log('Go!!!!')

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

  for (const aiClass of battleAIs) {
    await game.battleAIs.register(new aiClass(game))
  }

  for (const [ song, path ] of music) {
    await game.music.register(song, path)
  }

  await game.go()
}

main()
  .catch(err => console.error(err))
