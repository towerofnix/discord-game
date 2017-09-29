const { BattleMove } = require('../../../lib/BattleMove')

class SkipTurn extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Skip Turn',
      id: 'skip-turn',
      emoji: '⚓' // Anchor
    })
  }

  async getActionString(actorId) {
    const name = await this.game.battleCharacters.getName(actorId)
    switch (await this.game.battleCharacters.getPronoun(actorId)) {
      case 'she': return `${name} skips her turn.`
      case 'he': return `${name} skips his turn.`
      case 'it': return `${name} skips its turn.`
      case 'they': default: return `${name} skips their turn.`
    }
  }
}

module.exports = SkipTurn
