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

    const baseDamage = 2
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}

module.exports = Tackle
