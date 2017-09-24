const { Battle } = require('../Battle')
const { User } = require('../User')
const { env } = require('../env')
const { log } = require('../util')

const chalk = require('chalk')

class MusicController {
  constructor(game) {
    if (!game) throw new TypeError('new MusicController(Game game) expected')

    this.game = game
  }

  // TODO actually play music in channels using _more_ bot accounts!

  async getSongRoleAndChannel(song, guild) {
    // Gets the Discord role and channel for a given song. Creates them,
    // if they don't already exist.

    if (!song || typeof song !== 'string') throw new TypeError('MusicController#getSongRoleAndChannel(string song) expected')
    if (!guild /* TODO: Type-check */) throw new TypeError('MusicController#getSongRoleAndChannel(, discord.Guild guild) expected')

    if (env('music_enabled', 'boolean') === false) {
      log.warn(chalk`{yellow music_enabled} is {purple false} but MusicController#getSongRoleAndChannel() was called anyway`)
      return false
    }

    // Music channels will probably be named the same as some room channels
    // (e.g. big-town-castle), and since two channels can't have the same name,
    // we use a prefix here, to make it less likely for a collision.
    const roleName = `listening to: ${song}`
    const channelName = `music-${song}`

    let role = guild.roles.find('name', roleName)

    if (role === null) {
      role = await guild.createRole({ name: roleName })
    }

    let channel = guild.channels.findKey('name', channelName)

    if (channel === null) {
      const everyoneRole = guild.id

      channel = await guild.createChannel(channelName, 'voice', [
        { id: everyoneRole, deny: 1115136, allow: 0 }, // Deny connect, read, view message history (TODO: check whether those last two do anything)
        { id: role.id, deny: 0, allow: 9437184 } // Allow connect
      ])
    }

    return {role, channel}
  }

  async play(song, user) {
    if (!song || typeof song !== 'string') throw new TypeError('MusicController#play(string song) expected')
    if (!user || !(user instanceof User)) throw new TypeError('MusicController#play(, User user) expected')

    if (env('music_enabled', 'boolean') === false) {
      log.warn(chalk`{yellow music_enabled} is {purple false} but MusicController#play() was called anyway`)
      return false
    }

    const guild = this.game.guild
    const { role, channel } = await this.getSongRoleAndChannel(song, guild)
    const member = await user.getMember(guild)

    // give user the "listening to: <song>" role so they can actually join the channel
    await member.addRole(role)

    // move them to the voice channel
    // (note: setVoiceChannel cannot *put* people in voice channels if they aren't
    // already in one! no idea why that doesnt throw an error, though...)
    await member.setVoiceChannel(channel)

    // remove previous "listening to" role
    const newRoleName = role.name
    for (let [ id, role ] of member.roles) {
      if (role.name.startsWith('listening to:') && role.name !== newRoleName) {
        await member.removeRole(id)
      }
    }

    return true
  }
}

module.exports = { MusicController }
