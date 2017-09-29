const { BasicDatabaseController } = require('./BasicDatabaseController')

const Datastore = require('nedb-promise')
const shortid = require('shortid')

const db = new Datastore({
  filename: 'data/teams.json',
  autoload: true,
})

const TeamData = { members: Array }

class TeamController extends BasicDatabaseController {
  constructor(game) {
    if (!game) throw new TypeError('new TeamController(Game game) expected')

    super(db, TeamData)

    this.game = game
  }

  async getMembers(id) {
    return await this.getProperty(id, 'members')
  }

  async addMember(id, member) {
    console.log(id, typeof id, typeof id !== 'string')
    if (!id || typeof id !== 'string') throw new TypeError('TeamController#addMember(string id) expected')
    if (!member || typeof member !== 'string') throw new TypeError('TeamController#addMember(, string member) expected')

    const ret = await this.update(id, { $push: { members: member } })

    await this._addUserToTeamRole(id, member)

    return ret
  }

  async getRoleName(id) {
    // Doesn't actually do anything asynchronous, but is an async function for
    // consistency with most other functions in this class.

    return `in team: ${id}`
  }

  async getRole(id) {
    const roleName = await this.getRoleName(id)

    let role = this.game.guild.roles.find(role => role.name === roleName)

    if (role === null) {
      role = await this.game.guild.createRole({ name: roleName })
    }

    return role
  }

  async updateUserTeamRoles(id) {
    if (!id || typeof id !== 'string') throw new TypeError('TeamController#updateUserTeamRoles(string id) expected')

    const role = await this.getRole(id)

    for (const battleCharacterId of await this.getMembers(id)) {
      await this._addUserToTeamRole(id, battleCharacterId)
    }
  }

  async _addUserToTeamRole(teamId, battleCharacterId) {
    if (!teamId || typeof id !== 'string') throw new TypeError('TeamController#_addUserToTeamRole(string teamId) expected')
    if (!battleCharacterId || typeof battleCharacterId !== 'string') throw new TypeError('TeamController#_addUserToTeamRole(, string battleCharacterId) expected')

    const type = await this.game.battleCharacters.getCharacterType(battleCharacterId)

    if (type === 'user') {
      const id = await this.game.battleCharacters.getCharacterId(battleCharacterId)
      const member = await this.game.users.getDiscordMember(id)
      await member.addRole(role)
    }
  }

  async findByMember(member) {
    return await this.db.find({ members: { $elemMatch: member } }, { _id: 1 })
  }

  async findOrCreateForMember(member) {
    const find = await this.findByMember(member)

    if (find.length > 0) {
      return find[0]._id
    } else {
      return await this.createNew([member])
    }
  }

  async createNew(members = []) {
    if (members && !Array.isArray(members)) throw new TypeError('TeamController#createNew(optional array members) expected')

    const id = shortid.generate().toLowerCase()

    await this.add(id, { members })

    return id
  }
}

module.exports = { TeamController, TeamData }
