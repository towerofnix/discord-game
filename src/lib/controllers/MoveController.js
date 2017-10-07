const { log } = require('../util')

class MoveController extends Map {
  constructor(game) {
    super()

    this.game = game
  }

  register(move) {
    log.debug(`Registering move: ${move.name} (ID: ${move.id})`)
    this.set(move.id, move)
  }
}

module.exports = { MoveController }
