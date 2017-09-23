const { Room } = require('../../lib/Room')

class LonelyVoid extends Room {
  constructor() {
    super('lonely-void', 'Lonely Void')
  }
}

module.exports = { LonelyVoid }
