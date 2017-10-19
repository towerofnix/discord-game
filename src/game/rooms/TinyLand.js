import Room from '../../lib/Room'
import richWrite from '../../lib/util/richWrite'

export default class TinyLand extends Room {
  constructor(game) {
    super(game, 'tiny-land', 'Tiny Land')
  }

  async handleUserEntered(userId) {
    // Await this.game.musicController.play('tiny-land', user)

    // TODO: send message to user function, or something

    const { channel } = await this.game.rooms.getChannelAndRole(this.id)

    await richWrite(channel, 0xFF0033, 'Tiny Land', 'This place is exclusive to TINY BUGS ONLY!!!!!!!!! Get out now. R~!~`AHHHGHSdf.')

    setTimeout(() => {
      this.game.users.setLocation(userId, 'lonely-void')
    }, 4000)
  }
}
