import BattleMove from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class ColdBreath extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Cold Breath',
      id: 'cold-breath',
      emoji: '😤' // :triumph:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)

    await battle.writeMoveMessage(this, 'RED', `${name} exhales a cold breath!`)

    const targetIds = await battle.getAllAliveCharacters()
      .then(asyncFilter(async id => await battle.game.teams.hasMember(actorTeamId, id) === false))

    for (const targetId of targetIds) {
      await battle.dealDamageToCharacter(this, targetId, await battle.getElementalDamage(4, 'ice', actorId, targetId))
    }
  }
}
