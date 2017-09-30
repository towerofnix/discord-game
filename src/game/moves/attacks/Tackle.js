const { BattleMove } = require('../../../lib/BattleMove.js')

class Tackle extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Tackle',
      id: 'tackle',
      emoji: '🙄'
    })
  }

  async go(actorId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 0xAA8888, `${await bc.getName(actorId)} tackles ${await bc.getName(targetId)}!`)
    await battle.dealDamageToCharacter(this, targetId, 2)
  }
}

module.exports = Tackle
