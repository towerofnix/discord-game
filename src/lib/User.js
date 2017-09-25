const discord = require('discord.js')
const camo = require('camo')

async function getMemberById(id, guild) {
  if (!id || typeof id !== 'string') throw new TypeError('getMemberById(string id) expected')
  if (!guild) throw new TypeError('getMemberById(, discord.Guild guild) expected')

  // discord.Guild#fetchMember has a cache, so we don't need to memoize this
  return await guild.fetchMember(id, true) // discord.GuildMember
}

class User extends camo.Document {
  constructor() {
    super()

    this._id = { type: String, unique: true, required: true } // discord.Snowflake
    this.currentRoom = { type: String, default: 'void' } // channel ID of Room
    //this.currentBattle = { type: String, default: '' }
  }

  static async getById(id) {
    if (!id || typeof id !== 'string') throw new TypeError('User.getById(string id) expected')
    return await User.findOne({ _id: id })
  }

  static async exists(id) {
    if (!id || typeof id !== 'string') throw new TypeError('User.exists(string id) expected')
    return await User.getById(id) !== null
  }

  async getMember(guild) {
    if (!guild) throw new TypeError('User#getMember(discord.Guild guild) expected')
    return await getMemberById(this._id, guild)
  }

  async getName(guild) {
    if (!guild) throw new TypeError('User#getName(discord.Guild guild) expected')
    return (await this.getMember(guild)).displayName
  }
}

module.exports = { User, getMemberById }
