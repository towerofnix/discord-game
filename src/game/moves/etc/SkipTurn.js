const { BattleMove } = require('../../../lib/BattleMove')

class SkipTurn extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Skip Turn',
      id: 'skip-turn',
      emoji: '⚓' // Anchor
    })
  }

  async go(actorId, _unsetTargetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)

    let string
    switch (await this.game.battleCharacters.getPronoun(actorId)) {
      case 'she': string = `${name} skips her turn.`; break
      case 'he': string = `${name} skips his turn.`; break
      case 'it': string = `${name} skips its turn.`; break
      case 'they': default: string = `${name} skips their turn.`
    }

    await battle.writeMoveMessage(this, 0x777777, string)
  }
}

module.exports = SkipTurn
