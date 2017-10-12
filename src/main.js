//const { Game } = require('./lib/Game')
import Game from './lib/Game'
import { log, checkTypes } from './lib/util'
//const { LonelyVoid } = require('./game/rooms/LonelyVoid')
//const { TinyLand } = require('./game/rooms/TinyLand')
import music from './game/music'
import battleAIs from './game/ais'
import * as moveCategories from './game/moves'
import rooms from './game/rooms'

console.log('Go!')

async function main() {
  process.on('uncaughtException', async err => {
    await log.fatal(err.stack || err)
  })

  process.on('unhandledRejection', async err => {
    await log.fatal(err.stack || err)
  })

  const game = new Game()
  await game.setup()

  for (const roomClass of rooms) {
    await game.rooms.register(new roomClass(game))
  }

  for (const category of Object.values(moveCategories)) {
    for (const moveClass of category) {
      await game.moves.register(new moveClass(game))
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
