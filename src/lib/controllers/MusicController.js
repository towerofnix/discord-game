import env from '../util/env'
import * as log from '../util/log'

import chalk from 'chalk'
import discord from 'discord.js'
import nodePath from 'path'

export default class MusicController {
  constructor(game) {
    if (!game) throw new TypeError('new MusicController(Game game) expected')

    this.game = game
    this.songs = new Map()
  }

  async register(song, path) {
    if (!song || typeof song !== 'string') throw new TypeError('MusicController#register(string song) expected')
    if (!path || typeof path !== 'string') throw new TypeError('MusicController#register(, string path) expected')

    log.debug('Registering song: ' + song)
    this.songs.set(song, { path, bot: null })
  }

  async playMusic() {
    const tokens = await env('music_bots', 'object')

    if (tokens.length < this.songs.size)
      throw new TypeError(`Environment music_bots array is too short (there are ${this.songs.size} songs, but only ${tokens.length} music bots available)`)

    await Promise.all(Array.from(this.songs.keys()).map((song, n) => new Promise((resolve, reject) => {
      const { path } = this.songs.get(song)
      const bot = new discord.Client()

      bot.on('ready', async() => {
        const { role, channel } = await this.getSongRoleAndChannel(song)
        const botMemberAsAdmin = this.game.guild.members.find('id', bot.user.id)
        const channelAsAdmin = this.game.guild.channels.find('id', channel)
        const channelAsBot = bot.guilds.first().channels.find('id', channel)

        await botMemberAsAdmin.setNickname('bot')
        await botMemberAsAdmin.addRole(role)
        await channelAsAdmin.overwritePermissions(bot.user.id, {
          // Holy crap
          SPEAK: true,
        })

        const voiceConn = await channelAsBot.join()

        this.songs.set(song, { path, bot, voiceConn })
        resolve()

        async function loop() {
          const dispatcher = voiceConn.playFile(nodePath.join(__dirname, path), {
            bitrate: 4000, // 48000 default
          })

          dispatcher.once('end', loop)
          dispatcher.once('error', loop)
        }

        loop()
      })

      bot.login(tokens[n])
        .catch(reject)
    })))
  }

  async getSongRoleAndChannel(song) {
    // Gets the Discord role and channel for a given song. Creates them,
    // if they don't already exist.

    if (!song || typeof song !== 'string') throw new TypeError('MusicController#getSongRoleAndChannel(string song) expected')

    if (await env('music_enabled', 'boolean') === false) {
      log.warn(chalk`{yellow music_enabled} is {magenta false} but MusicController#getSongRoleAndChannel() was called anyway`)
      return { role: null, channel: null }
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

      channel = channel.id

      await log.success(chalk`Created {magenta ${channelName}} channel`)
    }

    return { role, channel }
  }

  async giveRoles() {
    if (await env('music_enabled', 'boolean') === false) return

    const users = await this.game.users.list()

    for (const id of users) {
      const song = await this.game.users.getListeningTo(id)

      if (song !== null) {
        await log.debug(`Giving user ${id} listening-to role`)
        const { role } = await this.getSongRoleAndChannel(song)
        const member = await this.game.users.getDiscordMember(id)

        // Give user the "listening to: <song>" role
        await member.addRole(role)

        // Remove previous "listening to" role
        for (const [ id, mRole ] of member.roles) {
          if (role.name.startsWith('listening to:') && mRole.name !== mRole.name) {
            await member.removeRole(id)
          }
        }
      }
    }
  }
}
