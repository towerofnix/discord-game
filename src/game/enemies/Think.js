const { Enemy } = require('../../lib/Enemy')

class Think extends Enemy {
  constructor() {
    super({
      name: 'Think',
      id: 'think',
    })
  }
}

module.exports = Think
