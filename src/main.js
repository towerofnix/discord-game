import Game from './lib/Game'
import { fatal } from './lib/util/log'
import checkTypes from './lib/util/checkTypes'
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
