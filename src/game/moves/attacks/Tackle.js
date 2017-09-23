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
}

module.exports = { Tackle }
