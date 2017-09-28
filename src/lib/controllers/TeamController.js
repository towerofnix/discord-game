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

    return await this.update(id, { $push: { members: member } })
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
