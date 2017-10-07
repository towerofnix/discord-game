const { BattleMove, deadOnly } = require('../../../lib/BattleMove.js')

class Revive extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Revive',
      id: 'revive',
      emoji: '😘', // :kissing_heart:
      targetFilter: deadOnly,
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 0xD96FCA, `${await bc.getName(actorId)} casts Revive.`)

    await battle.healCharacter(this, targetId, 5)
    await battle.setTemporaryEffect(actorId, 'rest', 2)
  }
}

module.exports = Revive
