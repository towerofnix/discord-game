const { log } = require('./util')
const { User } = require('./User')

class Room {
  constructor(channelName, displayName) {
    if (!channelName || typeof channelName !== 'string') throw new TypeError('new Room(string channelName) expected')
    if (!displayName || typeof displayName !== 'string') throw new TypeError('new Room(, string displayName) expected')

    this.channelName = channelName
    this.displayName = displayName
  }

  async handleUserEntered(user, game) {}
  async getVerbChoices(verb, user, game) {}
  async handleVerbChoice(verb, choice, user, game) {}
}

module.exports = { Room }
