import BattleMove, { aliveOnly } from '../../../lib/BattleMove'

export default class Tackle extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Tackle',
      id: 'tackle',
      emoji: '🙄',
      targetFilter: aliveOnly,
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, 'RED', `${await bc.getName(actorId)} tackles ${await bc.getName(targetId)}!`)

    const baseDamage = 2
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}
