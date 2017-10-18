import BattleMove from '../../../lib/BattleMove'

export default class Defend extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Defend',
      id: 'defend',
      emoji: '🛡' // :shield:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)
    await battle.writeMoveMessage(this, 'GREY', `${name} defends.`)

    battle.addTemporaryEffect(actorId, {
      name: 'Defending',
      getDisplayString: () => '',
      type: 'defend',
      value: 1
    })
  }
}
