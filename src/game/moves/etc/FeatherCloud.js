import BattleMove from '../../../lib/BattleMove'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class FeatherCloud extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Feather Cloud',
      id: 'feather-cloud',
      emoji: '🐔' // :chicken:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)

    let str

    switch (await this.game.battleCharacters.getPronoun(actorId)) {
      case 'she': str = `${name} shakes her body, sending up a cloud of feathers!`; break
      case 'he': str = `${name} shakes his body, sending up a cloud of feathers!`; break
      case 'it': str = `${name} shakes its body, sending up a cloud of feathers!`; break
      case 'they': default: str = `${name} shakes their body, sending up a cloud of feathers!`
    }

    await battle.writeMoveMessage(this, 'GREY', str)

    const targetIds = await this.game.teams.getMembers(actorTeamId)
      .then(asyncFilter(id => this.game.battleCharacters.isAlive(id)))

    for (const targetId of targetIds) {
      battle.addTemporaryEffect(targetId, {
        name: 'Feather Cloud',
        getDisplayString: turns => `${turns} turns`,
        type: 'invincible-against-normal',
        value: 2
      })
    }
  }
}
