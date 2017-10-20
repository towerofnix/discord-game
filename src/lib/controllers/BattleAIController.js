// @flow

import BasicMaplikeController from './BasicMaplikeController'
import Game from '../Game'
import BattleAI from '../BattleAI'
import { debug } from '../util/log'

type Pvoid = Promise<void>

export default class BattleAIController extends BasicMaplikeController {
  // Battle AIs control the moves a given ai-controlled battle character makes
  // in battle. They also control initial stats given to newly created characters
  // of that AI type. See the BattleAI class!

  constructor(game: Game) {
    super()

    this.game = game
  }

  async register(battleAI: BattleAI): Pvoid {
    await debug(`Registering battle AI: ${battleAI.name} (ID: ${battleAI.id})`)
    this.set(battleAI.id, battleAI)
  }
}
