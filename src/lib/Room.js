const { log } = require('./util')
const { User } = require('./User')

class Room {
  constructor(game, channelName, displayName) {
    if (!game || game instanceof require('./Game').Game === false) throw new TypeError('new Room(Game game) expected')
    if (!channelName || typeof channelName !== 'string') throw new TypeError('new Room(, string channelName) expected')
    if (!displayName || typeof displayName !== 'string') throw new TypeError('new Room(,, string displayName) expected')

    this.game = game
    this.channelName = channelName
    this.displayName = displayName
  }

  get id() {
    return this.channelName
  }

  async handleUserEntered(user, game) {}
  async getVerbChoices(verb, user, game) {}
  async handleVerbChoice(verb, choice, user, game) {}
}

module.exports = { Room }
