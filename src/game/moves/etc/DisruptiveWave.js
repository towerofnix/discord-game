import BattleMove, { aliveTeamsOnly } from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class DisruptiveWave extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Disruptive Wave',
      id: 'disruptive-wave',
      emoji: '😑', // :expressionless:
      targetType: 'team',
      targetFilter: aliveTeamsOnly,
    })
  }

  async go(actorId, actorTeamId, targetTeamId, battle) {
    const bc = this.game.battleCharacters

    const name = await bc.getName(actorId)

    let str
    switch (await bc.getPronoun(actorId)) {
      case 'she': str = `${name} releases a disruptive wave of energy from her fingertip!`; break
      case 'he': str = `${name} releases a disruptive wave of energy from his fingertip!`; break
      case 'it': str = `${name} releases a disruptive wave of energy from its fingertip!`; break
      case 'they': default: str = `${name} releases a disruptive wave of energy from their fingertip!`
    }
    await battle.writeMoveMessage(this, 0x73D4F4, str)

    const targetIds = await this.game.teams.getMembers(targetTeamId)
      .then(asyncFilter(charId => bc.isAlive(charId)))

    for (const targetId of targetIds) {
      battle.temporaryEffects.set(targetId, battle.temporaryEffects.get(targetId).filter(effect => {
        return effect.etc.disruptable !== true
      }))

      const tName = await bc.getName(targetId)
      await battle.writeMoveMessage(this, 0x73D4F4, `All effects on ${tName} removed.`)
    }
  }
}
