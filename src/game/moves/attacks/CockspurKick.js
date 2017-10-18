import BattleMove from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class CockspurKick extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Cockspur Kick',
      id: 'cockspur-kick',
      emoji: '👢' // :boot:
    })
  }

  async go(actorId, actorTeamId, targetTeamId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 'RED', `${await bc.getName(actorId)} uses Cockspur Kick!`)

    const targetIds = await this.game.teams.getMembers(targetTeamId)
      .then(asyncFilter(id => bc.isAlive(id)))

    const baseDamage = 3
    for (const targetId of targetIds) {
      const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
      await battle.dealDamageToCharacter(this, targetId, damage)
    }
  }
}
