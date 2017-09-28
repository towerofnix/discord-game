const { BasicDatabaseController } = require('./BasicDatabaseController')

const Datastore = require('nedb-promise')
const db = new Datastore({
  filename: 'data/users.json',
  autoload: true,
})

const UserData = { location: String, battleCharacter: String }

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

    // We update the data before running _setLocation, since _setLocation might
    // give the user ID to functions in other part of the game, which could be
    // expecting that the user's database entry already be updated (or behave
    // differently if it isn't).
    if (data.location)
      await this._setLocation(id, data.location)

    return ret
  }

  async getName(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#getName(String id) expected')

    const member = await this.getDiscordMember(id)
    return member.displayName
  }

  async getLocation(id) {
    return await this.getProperty(id, 'location')
  }

  async getBattleCharacter(id) {
    return await this.getProperty(id, 'battleCharacter')
  }

  async setLocation(id, newLocation) {
    // _setLocation is called by set, so we don't need to call it here.
    return await this.setProperty(id, 'location', newLocation)
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

  async getDiscordMember(id) {
    return await this.game.guild.members.find('id', id)
  }
}

module.exports = { UserController, UserData }
