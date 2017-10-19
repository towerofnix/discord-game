import Game from './lib/Game'
import { fatal } from './lib/util/log'
import music from './game/music'
import battleAIs from './game/ais'
import * as moveCategories from './game/moves'
import rooms from './game/rooms'

async function main() {
  process.on('uncaughtException', async err => {
    await fatal(err.stack || err)
  })

  process.on('unhandledRejection', async err => {
    await fatal(err.stack || err)
  })

  const game = new Game()
  await game.setup()

  for (const RoomClass of rooms) {
    await game.rooms.register(new RoomClass(game))
  }

  for (const category of Object.values(moveCategories)) {
    for (const MoveClass of category) {
      await game.moves.register(new MoveClass(game))
    }
  }

  for (const AIClass of battleAIs) {
    await game.battleAIs.register(new AIClass(game))
  }

  for (const [ song, path ] of music) {
    await game.music.register(song, path)
  }

  await game.go()
}

main()
