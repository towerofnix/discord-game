const { Room } = require('../../lib/Room')
const { richWrite, prompt } = require('../../lib/util')

const lookAtSign = '📜' // :scroll:

class LonelyVoid extends Room {
  constructor() {
    super('lonely-void', 'Lonely Void')
  }

  async handleUserEntered(user, game) {
    await super.handleUserEntered(user, game)

    await game.musicController.play('lol', user)

    const { channel } = await game.roomController.getRoomChannelAndRole(this)

    await richWrite(channel, user, 0xCCCCFF, 'Open Field', 'You find yourself in an open field. Tall grass grows as far as you can see. The sun gently shines down; the sky is light blue with many puffy clouds spread across it. A small cardboard sign sits in the grass next to you.')
  }

  async getVerbChoices(verb, user) {
    if (verb === 'examine') {
      return [
        ['The sign', '📜']
      ]
    }

    return []
  }

  async handleVerbChoice(verb, choice, user, game) {
    const { channel } = await game.roomController.getRoomChannelAndRole(this)

    if (verb === 'examine') {
      if (choice === lookAtSign) {
        await richWrite(channel, user, 0xCCCCFF, 'Cardboard Sign', 'It\'s a rectangular sign made of cardboard. The edges are rough. Scribbled onto the sign with a permanent marker is a message:\n\n"WELCOME TO THE LONELY VOID! We have cookies."')
      }
    }
  }
}

module.exports = { LonelyVoid }
