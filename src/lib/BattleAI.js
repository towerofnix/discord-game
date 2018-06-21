import asyncFilter from './util/asyncFilter'
import choose from './util/choose'
import { aliveTeamsOnly } from './BattleMove'

export default class BattleAI {
  constructor(opts) {
    if (!opts || typeof opts !== 'object') throw new TypeError('new Enemy(object opts) expected')

    if (opts.id && typeof opts.id === 'string')
      this.id = opts.id
    else throw new TypeError('new Enemy({ string id }) expected')

    if (opts.name && typeof opts.name === 'string')
      this.name = opts.name
    else throw new TypeError('new Enemy({ string name }) expected')
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    return { type: 'use move', move: battle.game.moves.get('skip-turn') }
  }

  // Controls default battle character info (max HP, pronoun, etc).
  // Override this!
  async getDefaultBattleCharacter() {
    return {}
  }

  async getOpponents(myTeamId, battle) {
    return await battle.getAllAliveCharacters()
      .then(asyncFilter(async char => await battle.game.teams.hasMember(myTeamId, char) === false))
  }

  async getOpponentTeams(myTeamId, battle) {
    return await Promise.resolve(battle.teams)
      .then(asyncFilter(teamId => teamId !== myTeamId))
      .then(asyncFilter(teamId => aliveTeamsOnly(teamId, battle.game)))
  }

  async getRandomOpponent(...args) {
    return choose(await this.getOpponents(...args))
  }

  async getRandomOpponentTeam(...args) {
    return choose(await this.getOpponentTeams(...args))
  }
}
