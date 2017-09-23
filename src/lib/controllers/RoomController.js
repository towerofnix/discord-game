const { Room } = require('../Room')

class RoomController {
  constructor() {
    // Quick access mapping of channel name -> room object.
    this.roomMap = new Map()
  }

  async registerRoom(room) {
    if (!room || !(room instanceof Room)) throw new TypeError('RoomController#registerRoom(Room room) expected')

    // Discord'y stuff here!
    // TODO: Implement this, lol.
    // - Should do a sanity check - channels should exist, and have the right
    //   description and permissions. (If they don't, make/set them.)

    await log.info(`Registering room: ${room.displayName} #${room.channelName}`)
    this.roomMap.set
  }
}

module.exports = { RoomController }
