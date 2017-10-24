import BattleAI from '../../lib/BattleAI'
import asyncFilter from '../../lib/util/asyncFilter'
import { aliveTeamsOnly } from '../../lib/BattleMove'

// "Foo Yung spews forth blazing fire!"
//  (Strong fire damage to every opponent)
//
// "Foo Yung exhales a cold breath!"
//  (Strong ice damage to every opponent)
//
// "Foo Yung casts Kabuff."
//  (Buff on all team members)
//
// "Foo Yung swings his sword at [name]!"
//  (Normal attack on one opponent)
//
// "Foo Yung shoots a disruptive wave of energy from his fingertip."
//  (Kills all status effects on all opponents)
//
// "Foo Yung does the fuddle dance."
//  (Confuse on all party members)
//
// "Foo Yung casts Zing."
//  (Revives Chow Mein)

export default class FooYung extends BattleAI {
  constructor() {
    super({
      name: 'Foo Yung',
      id: 'foo-yung'
    })
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    const opponents = await battle.getAllAliveCharacters()
      .then(asyncFilter(async char => await battle.game.teams.hasMember(myTeamId, char) === false))

    const targetCharacter = opponents[Math.floor(Math.random() * opponents.length)]

    const opponentTeams = await Promise.resolve(battle.teams)
      .then(asyncFilter(teamId => teamId !== myTeamId))
      .then(asyncFilter(teamId => aliveTeamsOnly(teamId, battle.game)))

    const targetTeam = opponentTeams[Math.floor(Math.random() * opponentTeams.length)]

    const deadAllies = await battle.game.teams.getMembers(myTeamId)
      .then(asyncFilter(async char => await battle.game.battleCharacters.isAlive(char) === false))

    const targetDeadAlly = deadAllies[Math.floor(Math.random() * deadAllies.length)]

    const willUseAttack = Math.random() < 0.1

    if (willUseAttack && opponents.length > 0) {
      const random = Math.random()

      if (random < 0.3) {
        return { type: 'use move', move: 'blazing-fire' }
      } else if (random < 0.6) {
        return { type: 'use move', move: 'cold-breath' }
      } else {
        return { type: 'use move', move: 'foo-yung-attack', target: targetCharacter }
      }
    } else {
      const random = 1.0 || Math.random()

      if (random < 0.5) {
        return { type: 'use move', move: 'kabuff', target: myTeamId }
      } else if (random > 0.9 && targetDeadAlly) {
        return { type: 'use move', move: 'revive', target: targetDeadAlly }
      } else {
        return { type: 'use move', move: 'disruptive-wave', target: targetTeam }
      }
    }
  }

  getDefaultBattleCharacter() {
    return {
      pronoun: 'he',
      maxHP: 40
    }
  }
}
