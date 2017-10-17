import BattleAI from '../../lib/BattleAI'
import asyncFilter from '../../lib/util/asyncFilter'

export default class AirRat extends BattleAI {
  constructor() {
    super({
      name: 'Air Rat',
      id: 'air-rat',
    })
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    let move
    const random = Math.random()
    if (random < 0.3) {
      move = 'air-rat-bite'
    } else if (random < 0.8) {
      move = 'air-rat-tail-whip'
    } else {
      move = 'air-rat-summon-allies'
    }

    if (move === 'air-rat-tail-whip' || move === 'air-rat-bite') {
      const validTargets = await battle.getAllAliveCharacters()
        .then(asyncFilter(async char => await battle.game.teams.hasMember(myTeamId, char) === false))

      if (validTargets.length === 0) {
        return { type: 'use move', move: 'skip-turn' }
      }

      const target = validTargets[Math.floor(Math.random() * validTargets.length)]

      return { type: 'use move', move, target }
    } else {
      return { type: 'use move', move }
    }
  }
}
