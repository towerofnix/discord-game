const { env } = require('../env')
const { log } = require('../util')

const chalk = require('chalk')

class MusicController {
  constructor(game) {
    if (!game) throw new TypeError('new MusicController(Game game) expected')

    this.game = game
    this.songs = new Map()
  }

  async register(song, path) {
    if (!song || typeof song !== 'string') throw new TypeError('MusicController#register(string song) expected')
    if (!path || typeof path !== 'string') throw new TypeError('MusicController#register(, string path) expected')

    log.debug('Registering song: ' + song)
    this.songs.set(song, path)
  }

  async playMusic() {
    for (const song of this.songs.keys()) {
      const path = this.songs.get(song)
      const { role, channel } = this.getSongRoleAndChannel(song)
      // TODO actually play music in channels using _more_ bot accounts!
    }
  }

  async getSongRoleAndChannel(song) {
    // Gets the Discord role and channel for a given song. Creates them,
    // if they don't already exist.

    if (!song || typeof song !== 'string') throw new TypeError('MusicController#getSongRoleAndChannel(string song) expected')

    if (await env('music_enabled', 'boolean') === false) {
      log.warn(chalk`{yellow music_enabled} is {magenta false} but MusicController#getSongRoleAndChannel() was called anyway`)
      return {role: null, channel: null}
    }

    // Music channels will probably be named the same as some room channels
    // (e.g. big-town-castle), and since two channels can't have the same name,
    // we use a prefix here, to make it less likely for a collision.
    const roleName = `listening to: ${song}`
    const channelName = `music-${song}`

    const guild = this.game.guild
    let role = guild.roles.find('name', roleName)

    if (role === null) {
      role = await guild.createRole({ name: roleName })
      await log.success(chalk`Created {magenta ${roleName}} role`)
    }

    let channel = guild.channels.findKey('name', channelName)

    if (channel === null) {
      const everyoneRole = guild.id

      channel = await guild.createChannel(channelName, 'voice', [
        { id: everyoneRole, deny: 3212288, allow: 0 }, // -conn -view -speak
        { id: role.id, deny: 0, allow: 1049600 } // +conn +view
      ])

      await log.success(chalk`Created {magenta ${channelName}} channel`)
    }

    return {role, channel}
  }

  async giveRoles() {
    if (await env('music_enabled', 'boolean') === false) return

    const users = await this.game.users.list()

    for (const id of users) {
      const song = await this.game.users.getListeningTo(id)

      if (song !== null) {
        await log.debug(`Giving user ${id} listening-to role`)
        const { role } = await this.getSongRoleAndChannel(song)

        // give user the "listening to: <song>" role
        const member = await this.game.users.getDiscordMember(id)
          .then(member => member.addRole(role))

        // remove previous "listening to" role
        for (let [ id, mRole ] of member.roles) {
          if (role.name.startsWith('listening to:') && mRole.name !== mRole.name) {
            await member.removeRole(id)
          }
        }
      }
    }
  }

  // DEPRECATED use UserController#setListeningTo(id, song) instead
  async play(song, userId) {
    if (typeof song !== 'string' && song !== null) throw new TypeError('MusicController#play(string | null song) expected')
    if (!userId) throw new TypeError('MusicController#play(, string userId) expected')

    if (env('music_enabled', 'boolean') === false) {
      log.warn(chalk`{yellow music_enabled} is {magenta false} but MusicController#play() was called anyway`)
      console.stack('deprecation stack')
      return false
    }

    await log.warn(chalk`{red MusicControler#play} is deprecated; use {red UserController#setListeningTo} instead`)

    const member = await this.game.users.getDiscordMember(userId)

    let newRoleName = ''

    if (song !== null) {
      const { role, channel } = await this.getSongRoleAndChannel(song)

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

    // persist the song to the db
    await this.game.users.setListeningTo(userId, song)

    return true
  }
}

module.exports = { MusicController }
