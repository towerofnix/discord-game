const { Room } = require('../../lib/Room')

class LonelyVoid extends Room {
  constructor() {
    super('lonely-void', 'Lonely Void')
  }

  async handleUserEntered(user, game) {
    await game.musicController.play('lol', user)
  }
}

module.exports = { LonelyVoid }
