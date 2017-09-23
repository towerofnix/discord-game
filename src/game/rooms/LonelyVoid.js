const { Room } = require('../../lib/Room')

class LonelyVoid extends Room {
  constructor() {
    super('lonely-void', 'Lonely Void')
  }

  async onjoin(user, game) {
    await game.musicController.play('lol', user)
  }
}

module.exports = { LonelyVoid }
