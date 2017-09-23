const { log } = require('./util')

class Room {
  constructor(channelName, displayName) {
    if (!channelName || typeof channelName !== 'string') throw new TypeError('new Room(string channelName) expected')
    if (!displayName || typeof displayName !== 'string') throw new TypeError('new Room(, string displayName) expected')

    this.channelName = channelName
    this.displayName = displayName
  }
}

async function registerRoom(room) {
  // Discord'y stuff here!
  // TODO: Implement this, lol.
  // - Should do a sanity check - channels should exist, and have the right
  //   description and permissions. (If they don't, make/set them.)
  await log.info(`Registering room: ${room.displayName} #${room.channelName}`)
}

module.exports = { Room, registerRoom }
