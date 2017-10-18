import BattleMove, { aliveOnly } from '../../../lib/BattleMove.js'

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

    const buff = 4
    await battle.addTemporaryEffect(targetId, {
      type: 'defense-buff',
      name: 'Defense buff',
      value: buff
    })

    await battle.writeMoveMessage(this, 0x22CC55, `${await bc.getName(targetId)}'s defense is boosted to +${buff}!`)
  }
}
