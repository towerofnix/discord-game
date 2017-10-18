import BattleAI from '../../lib/BattleAI'
import asyncFilter from '../../lib/util/asyncFilter'

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

    const willUseAttack = Math.random() < 0.8

    if (willUseAttack && opponents.length > 0) {
      const random = Math.random()

      const targetCharacter = opponents[Math.floor(Math.random() * opponents.length)]

      if (random < 0.3) {
        return { type: 'use move', move: 'blazing-fire' }
      } else if (random < 0.6) {
        return { type: 'use move', move: 'cold-breath' }
      } else {
        return { type: 'use move', move: 'foo-yung-attack', target: targetCharacter }
      }
    } else {
      return { type: 'use move', move: 'kabuff', target: myTeamId }
    }
  }

  getDefaultBattleCharacter() {
    return {
      pronoun: 'he',
      maxHP: 40
    }
  }
}
