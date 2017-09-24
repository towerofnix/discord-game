const { Room } = require('../Room')
const { log } = require('../util')

class RoomController {
  constructor(game) {
    this.game = game

    // Quick access mapping of channel name -> room object.
    this.roomMap = new Map()

    // TODO: Bad
    this.game.commandController.on('.create-room-channel', async () => {
      await this.createRoomChannelAndRole(this.roomMap.get('lonely-void'))
    })
  }

  async moveUserToRoom(roomId, user) {
    if (!roomId) throw new TypeError(`RoomController#userJoin(string roomId) expected`)
    if (!user) throw new TypeError(`RoomController#userJoin(, User user) expected`)

    const room = this.roomMap.get(roomId)

    if (!room) throw new TypeError(`RoomController#userJoin(string roomId) does not exist`)

    const roleName = `in location: ${room.channelName}`
    const member = await user.getMember(this.game.guild)
    const guild = this.game.guild

    let role = guild.roles.find('name', roleName)

    // remove previous "in location" role [if any]
    for (let [ id, role ] of member.roles) {
      if (role.name.startsWith('in location:'))
        await member.removeRole(id)
    }

    // add user to channel
    await member.addRole(role)

    // notify room of new member
    if (room.onjoin) await room.onjoin(user, this.game)
  }

  async registerRoom(room) {
    if (!room || !(room instanceof Room)) throw new TypeError('RoomController#registerRoom(Room room) expected')

    // Discord'y stuff here!
    // TODO: Implement this, lol.
    // - Should do a sanity check - channels should exist, and have the right
    //   description and permissions. (If they don't, make/set them.)

    await log.info(`Registering room: ${room.displayName} #${room.channelName}`)
    this.roomMap.set(room.channelName, room)
  }

  async createRoomChannelAndRole(room) {
    // TODO: Make this more like RoomController#getSongRoleAndChannel

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
  }
}

module.exports = { RoomController }
