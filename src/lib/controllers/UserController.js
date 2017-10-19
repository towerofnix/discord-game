// @flow

import BasicDatabaseController from './BasicDatabaseController'
import Game from '../Game'
import { either } from '../util/checkTypes'
import asyncFilter from '../util/asyncFilter'

import Datastore from 'nedb-promise'
import discord from 'discord.js'

const db = new Datastore({
  filename: 'data/users.json',
  autoload: true,
})

export const UserData = {
  location: String,
  battleCharacter: String,
  listeningTo: either(String, null),
}

export default class UserController extends BasicDatabaseController {
  game: Game

  constructor(game: Game) {
    super(db, UserData)

    this.game = game
  }

  async add(id: string, data: Object) {
    const ret = await super.add(id, data)

    if (data.location)
      await this._setLocation(id, data.location)

    return ret
  }

  async set(id: string, data: Object) {
    const ret = await super.set(id, data)

    // TODO refactor these into a BasicDatabaseController#onSetProperty(prop, fn).
    // We update the data before running _setLocation, since _setLocation might
    // give the user ID to functions in other part of the game, which could be
    // expecting that the user's database entry already be updated (or behave
    // differently if it isn't).
    if (data.location)
      await this._setLocation(id, data.location)
    if (data.listeningTo)
      await this._setListeningTo(id, data.listeningTo)

    return ret
  }

  async list(): Promise<Array<string>> {
    // Doesn't return users who don't have Discord members joined to the game guild.
    return await this.filterByLiveDiscordMembers(await super.list())
  }

  async filterByLiveDiscordMembers(userArray: Array<string>): Promise<Array<string>> {
    const users = await Promise.resolve(userArray)
      .then(asyncFilter(async id => await this.getDiscordMember(id) !== null))
    return users
  }

  async getName(id: string): Promise<string> {
    const member = await this.getDiscordMember(id)
    return member.displayName
  }

  async getLocation(id: string): Promise<string> { return await this.getProperty(id, 'location') }
  async setLocation(id: string, newLocation: string) { await this.setProperty(id, 'location', newLocation) }

  async findByLocation(location: string): Promise<Array<string>> {
    return await this.filterByLiveDiscordMembers(await this.findByProperty('location', location))
  }

  async getBattleCharacter(id: string): Promise<string> { return await this.getProperty(id, 'battleCharacter') }

  async getListeningTo(id: string): Promise<string> { return await this.getProperty(id, 'listeningTo') }
  async setListeningTo(id: string, song: string) { await this.setProperty(id, 'listeningTo', song) }

  async getDiscordMember(id: string): Promise<discord.Member> {
    return await this.game.guild.members.find('id', id)
  }

  async _setListeningTo(id: string, song: string) {
    // Peform setListeningTo side-effects

    const member = await this.getDiscordMember(id)

    let newRoleName = ''

    if (song !== null) {
      const { role, channel } = await this.game.music.getSongRoleAndChannel(song)

      // Give user the "listening to: <song>" role so they can actually join the channel
      await member.addRole(role)

      // Move them to the voice channel
      // (note: setVoiceChannel cannot *put* people in voice channels if they aren't
      // already in one! no idea why that doesnt throw an error, though...)
      await member.setVoiceChannel(channel)

      // Set the new role name, so that this role won't be removed next
      newRoleName = role.name
    }

    // Remove previous "listening to" role
    for (const [ id, role ] of member.roles) {
      if (role.name.startsWith('listening to:') && role.name !== newRoleName) {
        await member.removeRole(id)
      }
    }
  }

  async _setLocation(userId: string, roomId: string) {
    // Perform setLocation side effects

    const member = await this.getDiscordMember(userId)

    // Remove the user from any location roles they might have previously
    // been in.
    for (const [ roleId, role ] of member.roles) {
      if (role.name.startsWith('in location:')) {
        await member.removeRole(roleId)
      }
    }

    const { role } = await this.game.rooms.getChannelAndRole(roomId)
    member.addRole(role)

    await this.game.rooms.notifyUserEntered(roomId, userId)
  }
}
