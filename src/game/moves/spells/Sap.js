const { BattleMove } = require('../../../lib/BattleMove.js')

class Sap extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Sap',
      id: 'sap',
      emoji: '😬', // :grimacing:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, /*FD*/0x996699, `${await bc.getName(actorId)} casts Sap.`)

    const debuff = 3
    await battle.setTemporaryEffect(targetId, 'attackBuff', -debuff)
    await battle.writeMoveMessage(this, 0x996699, `${await bc.getName(targetId)}'s attack is debuffed to -${debuff}!`)
  }
}

module.exports = Sap
