// @flow

import BasicMaplikeController from './BasicMaplikeController'
import Game from '../Game'
import BattleMove from '../BattleMove'
import { debug } from '../util/log'

type Pvoid = Promise<void>

export default class MoveController extends BasicMaplikeController {
  game: Game

  constructor(game: Game) {
    super()

    this.game = game
  }

  async register(move: BattleMove): Pvoid {
    await debug(`Registering move: ${move.name} (ID: ${move.id})`)
    this.set(move.id, move)
  }
}
