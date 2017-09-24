const { Room } = require('../Room')
const { User } = require('../User')
const { log } = require('../util')

class RoomController {
  constructor(game) {
    this.game = game

    // Quick access mapping of channel name -> room object.
    this.roomMap = new Map()

    // TODO: Bad
    this.game.commandController.on('.create-room-channel', async () => {
      await this.createRoomChannelAndRole(this.getRoomById('lonely-void'))
    })

    // TODO: Also bad
    this.game.commandController.on('.warp', async (command, rest, message) => {
      const where = rest.trim()

      if (this.hasRoomById(where) === false) {
        message.reply('That location does not exist!')
        return
      }

      const user = await User.getById(message.author.id)
      await this.moveUserToRoom(where, user)
    })
  }

  async moveUserToRoom(roomId, user) {
    if (!roomId || typeof roomId !== 'string') throw new TypeError('RoomController#moveUserToRoom(string roomId) expected')
    if (!user || user instanceof User === false) throw new TypeError('RoomController#moveUserToRoom(, User user) expected')

    const room = this.getRoomById(roomId)

    const roleName = `in location: ${room.channelName}`
    const member = await user.getMember(this.game.guild)
    const guild = this.game.guild

    const { role } = await this.getRoomChannelAndRole(room)

    // remove previous "in location" role [if any]
    for (let [ id, role ] of member.roles) {
      if (role.name.startsWith('in location:'))
        await member.removeRole(id)
    }

    // add user to channel
    await member.addRole(role)

    // notify room of new member
    await room.handleUserEntered(user, this.game)
  }

  hasRoomById(roomId) {
    // Checks if a room by the given ID exists.

    if (!roomId || typeof roomId !== 'string') throw new TypeError('RoomController#hasRoomById(string roomId) expected')

    return this.roomMap.has(roomId)
  }

  getRoomById(roomId) {
    // Gets the Room object with the given ID (which is its channel name).
    // Throws an error if the given room does not exist. (When handling, e.g.,
    // user input, you should use `hasRoomById` to check if the given room
    // exists before running getRoomById.)

    if (!roomId || typeof roomId !== 'string') throw new TypeError('RoomController#getRoomById(string roomId) expected')

    if (this.hasRoomById(roomId)) {
      return this.roomMap.get(roomId)
    } else {
      throw new Error('Room does not exist (use RoomController#hasRoomById() to check if it does)')
    }
  }

  async registerRoom(room) {
    if (!room || !(room instanceof Room)) throw new TypeError('RoomController#registerRoom(Room room) expected')

    await log.info(`Registering room: ${room.displayName} #${room.channelName}`)
    this.roomMap.set(room.channelName, room)
  }

  async getRoomChannelAndRole(room) {
    if (!room || !(room instanceof Room)) throw new TypeError('RoomController#createRoomChannelAndRole(Room room) expected')
    // TODO: Assert room is registered

    const guild = this.game.guild

    const roleName = `in location: ${room.channelName}`
    const channelName = room.channelName

    let role = guild.roles.find('name', roleName)

    if (role === null) {
      role = await guild.createRole({ name: roleName })
    }

    let channel = guild.channels.findKey('name', channelName)

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

module.exports = { RoomController }
