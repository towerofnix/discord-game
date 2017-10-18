import BattleMove, { aliveTeamsOnly } from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class Kabuff extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Kabuff',
      id: 'kabuff',
      emoji: '😁', // :grin:
      targetType: 'team',
      targetFilter: aliveTeamsOnly,
    })
  }

  async go(actorId, actorTeamId, targetTeamId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 0x22CC55, `${await bc.getName(actorId)} casts Kabuff.`)

    const buff = 3

    const targetIds = await this.game.teams.getMembers(targetTeamId)
      .then(asyncFilter(charId => bc.isAlive(charId)))

    for (const targetId of targetIds) {
      await battle.setTemporaryEffect(targetId, 'defenseBuff', buff)
      await battle.writeMoveMessage(this, 0x22CC55, `${await bc.getName(targetId)}'s defense is boosted to +${buff}!`)
    }
  }
}
