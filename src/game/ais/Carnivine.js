const { BattleAI } = require('../../lib/BattleAI')

class Carnivine extends BattleAI {
  constructor() {
    super({
      name: 'Carnivine',
      id: 'carnivine',
    })
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    const validTargets = await battle.getAllAliveCharacters()
      .then(chars => Promise.all(chars.map(async char => await battle.game.teams.hasMember(myTeamId, char) ? false : char)))
      .then(chars => chars.filter(char => char !== false))

    if (validTargets.length === 0) {
      return { type: 'use move', move: 'skip-turn' }
    }

    const target = validTargets[Math.floor(Math.random() * validTargets.length)]

    return { type: 'use move', move: 'carnivine-chomp', target }
  }
}

module.exports = Carnivine
