const { BattleAI } = require('../../lib/BattleAI')

class Think extends BattleAI {
  constructor() {
    super({
      name: 'Think',
      id: 'think',
    })
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    const validTargets = await battle.getAllCharacters()
      .then(chars => Promise.all(chars.map(async char => await battle.game.teams.hasMember(myTeamId, char) ? false : char)))
      .then(chars => chars.filter(char => char !== false))

    if (validTargets.length === 0) {
      return { type: 'use move', move: 'skip-turn' }
    }

    const target = validTargets[Math.floor(Math.random() * validTargets.length)]

    return { type: 'use move', move: 'tackle', target }
  }
}

module.exports = Think
