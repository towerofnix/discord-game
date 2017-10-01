const { BattleMove } = require('../../../lib/BattleMove.js')

class Buff extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Buff',
      id: 'buff',
      emoji: '😌', // :relieved:
    })
  }

  async go(actorId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 0xAA8888, `${await bc.getName(actorId)} casts Buff.`)

    const buff = 4
    await battle.setTemporaryEffect(targetId, 'defenseBuff', buff)
    await battle.writeMoveMessage(this, 0xAA8888, `${await bc.getName(targetId)}'s defense is boosted to +${buff}!`)
  }
}

module.exports = Tackle
