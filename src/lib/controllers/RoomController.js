import BasicMaplikeController from './BasicMaplikeController'
import Room from '../Room'
import * as log from '../util/log'

export default class RoomController extends BasicMaplikeController {
  constructor(game) {
    super()

    this.game = game
  }

  async notifyUserEntered(roomId, userId) {
    // notify room of new user
    const room = await this.get(roomId)
    await room.handleUserEntered(userId)
  }

  get(roomId) {
    // Gets the Room object with the given ID (which is its channel name).
    // Throws an error if the given room does not exist. (When handling, e.g.,
    // user input, you should use `has` to check if the given room exists
    // before running `get`.)

    if (!roomId || typeof roomId !== 'string') throw new TypeError('RoomController#get(string roomId) expected')

    if (this.has(roomId)) {
      return super.get(roomId)
    } else {
      throw new Error(`Room "${roomId}" does not exist (use RoomController#has() to check if it does)`)
    }
  }

  async register(roomObject) {
    if (!roomObject || !(roomObject instanceof Room)) throw new TypeError('RoomController#register(Room roomObject) expected')

    await log.debug(`Registering room: ${roomObject.displayName} #${roomObject.channelName}`)
    this.set(roomObject.channelName, roomObject)
  }

  async getChannelAndRole(id) {
    if (!id || typeof id !== 'string') throw new TypeError('RoomController#getChannelAndRole(string id) expected')
    // TODO: Assert room is registered

    const room = this.get(id)

    const guild = this.game.guild

    const roleName = `in location: ${room.channelName}`
    const channelName = room.channelName

    let role = guild.roles.find('name', roleName)

    if (role === null) {
      role = await guild.createRole({ name: roleName })
    }

    let channel = guild.channels.find('name', channelName)

    if (channel === null) {
      const everyoneRole = guild.id

      channel = await guild.createChannel(channelName, 'text', [
        { id: everyoneRole, deny: 3136, allow: 0 },
        { id: role.id, deny: 0, allow: 3072 },
      ])
    }

    return { role, channel }
  }
}
