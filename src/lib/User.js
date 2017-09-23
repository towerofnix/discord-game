const discord = require('discord.js')
const camo = require('camo')

async function getMemberById(id) {
  if (!id || typeof id !== 'string') throw 'getMemberById(string id) expected'

  // discord.Guild#fetchMember has a cache, so we don't need to memoize this
  return await global.guild.fetchMember(id, true) // discord.GuildMember
}

class User extends camo.Document {
  constructor() {
    super()

    this._id = { type: String, unique: true, required: true } // discord.Snowflake
    this.currentRoom = { type: String, default: 'void' } // reference to Room (TODO)
  }

  static async getById(id) {
    if (!id || typeof id !== 'string') throw 'User#getById(string id) expected'
    return await User.findOne({ _id: id })
  }

  static async exists(id) {
    if (!id || typeof id !== 'string') throw 'User#exists(string id) expected'
    return await User.getById(id) !== null
  }

  static async addNewUsers() {
    let numAdded = 0

    for (const [ id, member ] of global.guild.members) {
      // if this user is a bot, ignore it
      if (member.user.bot === true)
        continue

      // is this user in the database?
      if (await User.exists(id) === false) {
        // add the user to the database
        let user = User.create({ _id: id })
        await user.save()
        numAdded++
      }
    }

    return numAdded
  }

  async getName() {
    return (await getMemberById(this._id)).displayName
  }
}

module.exports = {User, getMemberById}
