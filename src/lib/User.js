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
    this.currentRoom = { type: String, default: 'void' } // reference to Room (TODO)
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

  static async addNewUsers(game, members) {
    if (!game) throw new TypeError('User.addNewUsers(Game game) expected')
    if (!members) throw new TypeError('User.addNewUsers(, discord.Collection<discord.Snowflake, discord.GuildMember> members) expected')
    let numAdded = 0

    for (const [ id, member ] of members) {
      // if this user is a bot, ignore it
      if (member.user.bot === true)
        continue

      // is this user in the database?
      if (await User.exists(id) === false) {
        // add the user to the database
        let user = User.create({ _id: id })
        await user.save()
        // add the user to #lonely-void (default room)
        await game.roomController.moveUserToRoom('lonely-void', user)
        numAdded++
      }
    }

    return numAdded
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
