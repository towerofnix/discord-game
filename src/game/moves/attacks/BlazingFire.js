import BattleMove from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class BlazingFire extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Blazing Fire',
      id: 'blazing-fire',
      emoji: '😤' // :triumph:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)

    await battle.writeMoveMessage(this, 'RED', `${name} spews forth blazing fire!`)

    const targetIds = await battle.getAllAliveCharacters()
      .then(asyncFilter(async id => await battle.game.teams.hasMember(actorTeamId, id) === false))

    for (const targetId of targetIds) {
      await battle.dealDamageToCharacter(this, targetId, await battle.getElementalDamage('fire', actorId, targetId, 4))
    }
  }
}
