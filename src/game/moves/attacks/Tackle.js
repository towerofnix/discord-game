const { Attack } = require('../../../lib/Attack.js')

class Tackle extends Attack {
  constructor() {
    super({
      name: 'Tackle',
      emoji: '🙄',

      type: 'physical',
      power: 2,
    })
  }

  getActionString(user, target) {
    return `${user.name} tackles ${target.name}!`
  }
}

module.exports = { Tackle }
