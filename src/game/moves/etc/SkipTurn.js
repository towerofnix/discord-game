const { BattleMove } = require('../../../lib/BattleMove')

class SkipTurn extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Skip Turn',
      id: 'skip-turn',
      emoji: '⚓' // Anchor
    })
  }
}

module.exports = SkipTurn
