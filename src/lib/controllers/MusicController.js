// @flow

import env from '../util/env'
import * as log from '../util/log'
import Game from '../Game'

import chalk from 'chalk'
import discord from 'discord.js'
import nodePath from 'path'

type Pvoid = Promise<void>

export default class MusicController {
  game: Game

  songs: Map<string, { path: string, bot: ?discord.Client }>

  constructor(game: Game) {
    this.game = game
    this.songs = new Map()
  }

  async register(song: string, path: string): Pvoid {
    log.debug('Registering song: ' + song)
    this.songs.set(song, { path, bot: null })
  }

  async playMusic(): Pvoid {
    const tokens = await env('music_bots', 'object')

    if (tokens.length < this.songs.size)
      throw new TypeError(`Environment music_bots array is too short (there are ${this.songs.size} songs, but only ${tokens.length} music bots available)`)

    await Promise.all(Array.from(this.songs.keys()).map((song, n) => new Promise((resolve: () => void, reject: () => void) => {
      const songObj = this.songs.get(song)

      if (!songObj) {
        return
      }

      const { path } = songObj
      const bot = new discord.Client()

      bot.on('ready', async (): Pvoid => {
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

        async function loop(): Pvoid {
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

  async getSongRoleAndChannel(song: string): Promise<{role: discord.Role, channel: discord.TextChannel}> {
    // Gets the Discord role and channel for a given song. Creates them,
    // if they don't already exist.

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

  async giveRoles(): Pvoid {
    if (await env('music_enabled', 'boolean') === false) return

    const users = await this.game.users.list()

    for (const id of users) {
      const song = await this.game.users.getListeningTo(id)

      if (song !== null) {
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
