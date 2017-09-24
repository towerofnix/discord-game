const { Room } = require('../../lib/Room')

class TinyLand extends Room {
  constructor() {
    super('tiny-land', 'Tiny Land')
  }

  async handleUserEntered(user, game) {
    await game.musicController.play('tiny-land', user)
  }
}

module.exports = { TinyLand }
