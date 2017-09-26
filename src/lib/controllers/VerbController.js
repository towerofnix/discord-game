const { promptOnMessage, log } = require('../util')
const { User } = require('../User')

class VerbController {
  constructor(game) {
    this.game = game
  }

  makeVerbCommandHandler(verb) {
    if (!verb || typeof verb !== 'string') throw new TypeError('Game#makeVerbHandler(string verb) expected')

    return async (command, rest, message) => {
      const user = await User.getById(message.author.id)

      if (this.game.roomController.hasRoomById(user.currentRoom) === false) {
        log.warn(`User ${message.author.tag} attempted to use a verb while in nonexistant room "${user.currentRoom}"!`)
        return false
      }

      const room = this.game.roomController.getRoomById(user.currentRoom)
      const { channel } = await this.game.roomController.getRoomChannelAndRole(room)

      if (rest.length === 0) {
        const choices = await room.getVerbChoices(verb, user, this.game) || []
        const choice = await promptOnMessage(message, choices, user)
        await room.handleVerbChoice(verb, choice, user, this.game)
      } else {
        console.log('Look at that thing.')
      }
    }
  }
}

module.exports = { VerbController }
