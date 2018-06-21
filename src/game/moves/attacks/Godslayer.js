import asyncFilter from '../../../lib/util/asyncFilter'
import BattleMove, { aliveOnly } from '../../../lib/BattleMove'
import MoveChargeEffect from '../../effects/MoveCharge'

const CHARGE_TURNS = 10

export default class Godslayer extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Godslayer',
      id: 'godslayer',
      emoji: '☠️' // :skull_crossbones:
    })
  }

  async go(actorId, actorTeamId, targetIds, battle) {
    if (battle.getTemporaryEffect(actorId, 'move-charge') < CHARGE_TURNS) {
      const val = battle.boostTemporaryEffect(actorId, MoveChargeEffect, 1)
      await battle.writeMoveMessage(this, 0xEE3333, `Godslayer is charged to ${val}/${CHARGE_TURNS}!`)
    }

    if (battle.getTemporaryEffect(actorId, 'move-charge') >= CHARGE_TURNS) {
      await battle.writeMoveMessage(this, 0xFF5555, 'Godslayer fully charged!')
      await battle.writeMoveMessage(this, 0xFF5555, 'A cursed blast washes over the battlefield...')

      const liveTargetIds = await Promise.resolve(targetIds)
        .then(asyncFilter(charId => battle.game.battleCharacters.isAlive(charId)))

      for (const targetId of liveTargetIds) {
        await battle.dealDamageToCharacter(this, targetId, 50000)
      }

      battle.temporaryEffects.set(actorId, battle.temporaryEffects.get(actorId).filter(effect => effect.type !== 'move-charge'))
    }
  }
}
