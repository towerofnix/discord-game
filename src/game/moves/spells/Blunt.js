import BattleMove, { aliveOnly } from '../../../lib/BattleMove'

export default class Blunt extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Blunt',
      id: 'blunt',
      emoji: '😬', // :grimacing:
      targetFilter: aliveOnly,
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    await battle.writeMoveMessage(this, /*FD*/0x996699, `${await bc.getName(actorId)} casts Blunt.`)

    const debuff = 3
    await battle.addTemporaryEffect(targetId, {
      name: 'Attack buff',
      type: 'attack-buff',
      value: -debuff
    })

    await battle.writeMoveMessage(this, 0x996699, `${await bc.getName(targetId)}'s attack is debuffed to -${debuff}!`)
  }
}
