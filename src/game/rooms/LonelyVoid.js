const { Room } = require('../../lib/Room')
const { richWrite, prompt } = require('../../lib/util')

class LonelyVoid extends Room {
  constructor() {
    super('lonely-void', 'Lonely Void')
  }

  async handleUserEntered(user, game) {
    await game.musicController.play('lol', user)

    const { channel } = await game.roomController.getRoomChannelAndRole(this)

    await richWrite(channel, user, 0xCCCCFF, 'Open Field', 'You find yourself in an open field. Tall grass grows as far as you can see. The sun gently shines down; the sky is light blue with many puffy clouds spread across it. A small cardboard sign sits in the grass next to you.')

    const lookAtSign = '📜' // :scroll:

    const choice = await prompt(channel, user, 'Action', [
      ['Look at the sign', lookAtSign]
    ])

    if (choice === lookAtSign) {
      await richWrite(channel, user, 0xCCCCFF, 'Open Field', 'It\'s a rectangular sign made of cardboard. The edges are rough. Scribbled onto the sign with a permanent marker is a message:\n\n"WELCOME TO THE LONELY VOID! We have cookies."')
    }
  }
}

module.exports = { LonelyVoid }
