const { log } = require('../util')

// Battle AIs control the moves a given ai-controlled battle character makes
// in battle. They also (TODO) control initial stats given to newly created
// characters of that AI type.

class BattleAIController extends Map {
  constructor(game) {
    super()

    this.game = game
  }

  async register(battleAI) {
    await log.debug(`Registering battle AI: ${battleAI.name} (ID: ${battleAI.id})`)
    this.set(battleAI.id, battleAI)
  }
}

module.exports = { BattleAIController }
