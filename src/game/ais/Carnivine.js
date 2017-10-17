import BattleAI from '../../lib/BattleAI'
import asyncFilter from '../../lib/util/asyncFilter'

export default class Carnivine extends BattleAI {
  constructor() {
    super({
      name: 'Carnivine',
      id: 'carnivine',
    })
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    const validTargets = await battle.getAllAliveCharacters()
      .then(asyncFilter(async char => await battle.game.teams.hasMember(myTeamId, char) === false))

    if (validTargets.length === 0) {
      return { type: 'use move', move: 'skip-turn' }
    }

    const target = validTargets[Math.floor(Math.random() * validTargets.length)]

    return { type: 'use move', move: 'carnivine-chomp', target }
  }
}
