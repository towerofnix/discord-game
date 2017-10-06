const { BattleMove } = require('../../../lib/BattleMove.js')

class AirRatBite extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Bite',
      id: 'air-rat-bite',
      emoji: '🙄'
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    const aName = await bc.getName(actorId)
    const tName = await bc.getName(targetId)

    await battle.writeMoveMessage(this, 'RED', `${aName} bites ${tName}!`)

    const baseDamage = 2
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}

module.exports = AirRatBite
