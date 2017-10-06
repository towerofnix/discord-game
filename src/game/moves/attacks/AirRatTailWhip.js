const { BattleMove } = require('../../../lib/BattleMove.js')

class AirRatTailWhip extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Tail Whip',
      id: 'air-rat-tail-whip',
      emoji: '🙄'
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    const aName = await bc.getName(actorId)
    const tName = await bc.getName(targetId)

    let string
    switch (await this.game.battleCharacters.getPronoun(actorId)) {
      case 'she': string = `${aName} whacks her tail into ${tName}!`; break
      case 'he': string = `${aName} whacks his tail into ${tName}!`; break
      case 'it': string = `${aName} whacks its tail into ${tName}!`; break
      case 'they': default: string = `${aName} whacks their tail into ${tName}!`
    }

    await battle.writeMoveMessage(this, 'RED', string)

    const baseDamage = 2
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}

module.exports = AirRatTailWhip
