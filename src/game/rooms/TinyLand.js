const { Room } = require('../../lib/Room')

const { richWrite } = require('../../lib/util')

class TinyLand extends Room {
  constructor() {
    super('tiny-land', 'Tiny Land')
  }

  async handleUserEntered(user, game) {
    await game.musicController.play('tiny-land', user)

    // TODO: send message to user function, or something

    const { channel } = await game.roomController.getRoomChannelAndRole(this)

    await richWrite(channel, 0xFF0033, 'Tiny Land', 'This place is exclusive to TINY BUGS ONLY!!!!!!!!! Get out now. R~!~`AHHHGHSdf.')

    setTimeout(() => {
      game.roomController.moveUserToRoom('lonely-void', user)
    }, 4000)
  }
}

module.exports = { TinyLand }
