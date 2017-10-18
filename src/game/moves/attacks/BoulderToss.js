import BattleMove from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class BoulderToss extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Boulder Toss',
      id: 'boulder-toss',
      emoji: '⛰' // :mountain:
    })
  }

  async go(actorId, actorTeamId, targetTeamId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 'RED', `${await bc.getName(actorId)} tosses a boulder!`)

    const targetIds = await this.game.teams.getMembers(targetTeamId)
      .then(asyncFilter(id => bc.isAlive(id)))

    const baseDamage = 5
    for (const targetId of targetIds) {
      await battle.dealDamageToCharacter(this, targetId, await battle.getEnvironmentalDamage(baseDamage, targetId))
    }
  }
}
