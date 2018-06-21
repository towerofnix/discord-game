import BattleMove, { aliveOnly } from '../../../lib/BattleMove'
import DefenseBuffEffect from '../../effects/DefenseBuff'

export default class Buff extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Buff',
      id: 'buff',
      emoji: '😌', // :relieved:
      targetFilter: aliveOnly,
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 0x22CC55, `${await bc.getName(actorId)} casts Buff.`)

    const newBuff = await battle.boostTemporaryEffect(targetId, DefenseBuffEffect, +4)

    await battle.writeMoveMessage(this, 0x22CC55, `${await bc.getName(targetId)}'s defense is boosted to ${newBuff > 0 ? '+' + newBuff : newBuff}!`)
  }
}
