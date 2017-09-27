const Datastore = require('nedb-promise')
const db = new Datastore({
  filename: 'data/users.json',
  autoload: true,
})

const { log, checkTypes } = require('../util')
const UserData = { hp: Number, location: String }

// async superset of Map
class UserController {
  constructor(game) {
    if (!game) throw new TypeError('new UserController(Game game) expected')

    this.game = game
  }

  async list() {
    return (await db.find({}, { _id: 1 })).map(user => user._id)
  }

  async has(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#has(String id) expected')
    return (await db.findOne({ _id: id }, { _id: 1 })) !== null
  }

  async add(id, data) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#add(String id) expected')
    if (!data || !checkTypes(data, UserData, true))
      throw new TypeError('UserController#add(, UserData data) expected')

    await db.insert(Object.assign({ _id: id }, data))
  }

  async delete(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#delete(String id) expected')

    await db.remove({ _id: id }, {})
  }

  async get(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#get(String id) expected')

    let doc = await db.findOne({ _id: id }, { _id: 0 })
    if (doc === null) throw new TypeError('UserController#get() user not found')

    return doc
  }

  async set(id, data) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#set(String id) expected')
    if (!data || !checkTypes(data, UserData, false))
      throw new TypeError('UserController#set(, UserData data) expected')

    if (data.location)
      await this._setLocation(id, location)

    let [ updated, doc ] = await db.update({ _id: id }, { $set: data }, { returnUpdatedDocs: true, multi: false })
    if (updated === 0) throw new TypeError('UserController#set() user not found')

    delete doc._id
    return doc
  }

  async getName(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#getName(String id) expected')

    let user = await this.game.guild.members.find('id', id)
    return user.displayName
  }

  async getHp(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#getHp(String id) expected')

    let doc = await db.findOne({ _id: id }, { _id: 0, hp: 1 })
    if (doc === null) throw new TypeError('UserController#getHp() user not found')

    return doc.hp
  }

  async setHp(id, hp) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#setHp(String id) expected')
    if (!hp || typeof hp !== 'number') throw new TypeError('UserController#setHp(, Number hp) expected')

    return await this.set(id, { hp })
  }

  async getLocation(id) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#getLocation(String id) expected')

    let doc = await db.findOne({ _id: id }, { _id: 0, location: 1 })
    if (doc === null) throw new TypeError('UserController#getLocation() user not found')

    return doc.location
  }

  async setLocation(id, location) {
    if (!id || typeof id !== 'string') throw new TypeError('UserController#setLocation(String id) expected')
    if (!location || typeof location !== 'string')
      throw new TypeError('UserController#setLocation(, String location) expected')

    await this._setLocation(id, location)
    return await this.set(id, { hp })
  }

  async _setLocation(id, location) {
    // Perform setLocation side effects

    // TODO:
    /*
    const room = this.rooms.get(id)

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

    user.currentRoom = room.channelName

    // notify room of new member
    await room.handleUserEntered(user, this.game)
    */
  }
}

module.exports = { UserController, UserData }
