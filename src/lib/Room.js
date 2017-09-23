const { log } = require('./util')

class Room {
  constructor(channelName, displayName) {
    if (!channelName || typeof channelName !== 'string') throw new TypeError('new Room(string channelName) expected')
    if (!displayName || typeof displayName !== 'string') throw new TypeError('new Room(, string displayName) expected')

    this.channelName = channelName
    this.displayName = displayName
  }
}

module.exports = { Room }
