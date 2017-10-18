import BattleAI from '../../lib/BattleAI'
import asyncFilter from '../../lib/util/asyncFilter'
import { aliveTeamsOnly } from '../../lib/BattleMove'

// "Chow Mein shakes his body, sending up a cloud of feathers!"
//  (Whole team invincibility for one turn)
//
// "Chow Mein musters his strength."
//  (Strong attack boost next turn)
//
// "Chow Mein is ready to take on any attack!"
//  (Strong defense boost this turn)
//
// "Chow Mein chops [name] with his flat palm!"
//  (Normal attack)
//
// "Chow Mein uses Cockspur Kick!"
//  (Normal attack against all in an opposing team)
//
// "Chow Mein tosses a boulder!"
//  (Attack against all in an opposing team)

export default class ChowMein extends BattleAI {
  constructor() {
    super({
      name: 'Chow Mein',
      id: 'chow-mein'
    })
  }

  getDefaultBattleCharacter() {
    return {
      pronoun: 'he',
      maxHP: 40
    }
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    const opponentTeams = await Promise.resolve(battle.teams)
      .then(asyncFilter(id => id !== myTeamId))
      .then(asyncFilter(id => aliveTeamsOnly(id, battle.game)))

    if (opponentTeams.length > 0 && Math.random() < 0.8) {
      const random = Math.random()
      const targetTeam = opponentTeams[Math.floor(Math.random() * opponentTeams.length)]

      const targetCharacters = await Promise.all(opponentTeams.map(team => battle.game.teams.getMembers(team)))
        .then(arrays => arrays.reduce((a, b) => a.concat(b), []))
        .then(asyncFilter(id => battle.game.battleCharacters.isAlive(id)))

      const targetCharacter = targetCharacters[Math.floor(Math.random() * targetCharacters.length)]

      if (random < 0.15) {
        return { type: 'use move', move: 'cockspur-kick', target: targetTeam }
      } else if (random < 0.3) {
        return { type: 'use move', move: 'boulder-toss', target: targetTeam }
      } else if (random < 0.8) {
        return { type: 'use move', move: 'chow-mein-attack', target: targetCharacter }
      } else {
        return { type: 'use move', move: 'muster-strength' }
      }
    } else {
      return { type: 'use move', move: 'feather-cloud' }
    }
  }
}
