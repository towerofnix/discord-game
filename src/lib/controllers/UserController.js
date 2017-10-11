const { BasicDatabaseController } = require('./BasicDatabaseController')
const { Either } = require('../util/checkTypes')

const Datastore = require('nedb-promise')
const db = new Datastore({
  filename: 'data/users.json',
  autoload: true,
})

const UserData = {
  location: String,
  battleCharacter: String,
  listeningTo: Either(String, null),
}

class UserController extends BasicDatabaseController {
  constructor(game) {
    if (!game) throw new TypeError('new UserController(Game game) expected')

    super(db, UserData)

    this.game = game
  }

  async add(id, data) {
    const ret = await super.add(id, data)

    if (data.location)
      await this._setLocation(id, data.location)

    return ret
  }

  async set(id, data) {
    const ret = await super.set(id, data)

    // TODO refactor these into a BasicDatabaseController#onSetProperty(prop, fn).
    // We update the data before running _setLocation, since _setLocation might
    // give the user ID to functions in other part of the game, which could be
    // expecting that the user's database entry already be updated (or behave
    // differently if it isn't).
    if (data.location)
      await this._setLocation(id, data.location)
    if (data.listeningTo)
      await this._setListeningTo(id, data.listeningTo)

    return ret
  }

  async list() {
    // Doesn't return users who don't have Discord members joined to the game guild.
    return await this.filterByLiveDiscordMembers(await super.list())
  }

  async filterByLiveDiscordMembers(userArray) {
    const exists = async id => await this.getDiscordMember(id) !== null
    return (await Promise.all(userArray.map(async id => (await exists(id) ? id : false))))
      .filter(item => item !== false)
  }

  async getName(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#getName(String id) expected')

    const member = await this.getDiscordMember(id)
    return member.displayName
  }

  async getLocation(id) { return await this.getProperty(id, 'location') }
  async setLocation(id, newLocation) { return await this.setProperty(id, 'location', newLocation) }

  async findByLocation(location) {
    return await this.filterByLiveDiscordMembers(await this.findByProperty('location', location))
  }

  async getBattleCharacter(id) { return await this.getProperty(id, 'battleCharacter') }

  async getListeningTo(id) { return await this.getProperty(id, 'listeningTo') }
  async setListeningTo(id, song) { return await this.setProperty(id, 'listeningTo', song) }

  async getDiscordMember(id) {
    return await this.game.guild.members.find('id', id)
  }

  async _setListeningTo(id, song) {
    // Peform setListeningTo side-effects

    const member = await this.getDiscordMember(id)

    let newRoleName = ''

    if (song !== null) {
      const { role, channel } = await this.game.music.getSongRoleAndChannel(song)

      // give user the "listening to: <song>" role so they can actually join the channel
      await member.addRole(role)

      // move them to the voice channel
      // (note: setVoiceChannel cannot *put* people in voice channels if they aren't
      // already in one! no idea why that doesnt throw an error, though...)
      await member.setVoiceChannel(channel)

      // set the new role name, so that this role won't be removed next
      newRoleName = role.name
    }

    // remove previous "listening to" role
    for (let [ id, role ] of member.roles) {
      if (role.name.startsWith('listening to:') && role.name !== newRoleName) {
        await member.removeRole(id)
      }
    }
  }

  async _setLocation(userId, roomId) {
    // Perform setLocation side effects

    const roleName = `in location: ${roomId}`
    const member = await this.getDiscordMember(userId)
    const guild = this.game.guild

    // Remove the user from any location roles they might have previously
    // been in.
    for (const [ roleId, role ] of member.roles) {
      if (role.name.startsWith('in location:')) {
        await member.removeRole(roleId)
      }
    }

    const { role } = await this.game.rooms.getChannelAndRole(roomId)
    member.addRole(role)

    await this.game.rooms.notifyUserEntered(roomId, userId)
  }
}

module.exports = { UserController, UserData }
