const { Attack } = require('../../../lib/Attack.js')

class Tackle extends Attack {
  constructor(game) {
    super(game, {
      name: 'Tackle',
      emoji: '🙄',

      type: 'physical',
      power: 2,
    })
  }

  async getActionString(userId, targetId) {
    return `${await this.game.battleCharacters.getName(userId)} tackles ${await this.game.battleCharacters.getName(targetId)}!`
  }
}

module.exports = { Tackle }
