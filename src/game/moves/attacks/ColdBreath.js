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
      // TODO: Figure out the damage formula for elemental damage!
      const damage = 4
      await battle.dealDamageToCharacter(this, targetId, damage)
    }
  }
}
