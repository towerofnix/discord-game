import { debug } from '../util/log'

export default class MoveController extends Map {
  constructor(game) {
    super()

    this.game = game
  }

  async register(move) {
    await debug(`Registering move: ${move.name} (ID: ${move.id})`)
    this.set(move.id, move)
  }
}
