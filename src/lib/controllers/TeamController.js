// @flow

import BasicDatabaseController from './BasicDatabaseController'
import Game from '../Game'

import Datastore from 'nedb-promise'
import shortid from 'shortid'
import discord from 'discord.js'

const db = new Datastore({
  filename: 'data/teams.json',
  autoload: true,
})

export const TeamData = { members: Array }

export default class TeamController extends BasicDatabaseController {
  game: Game

  constructor(game: Game) {
    super(db, TeamData)

    this.game = game
  }

  async getMembers(id: string): Promise<Array<string>> {
    return await this.getProperty(id, 'members')
  }

  async addMember(id: string, member: string) {
    if (await this.hasMember(id, member) === false) {
      await this.update(id, { $push: { members: member } })
      await this._addUserToTeamRole(id, member)
    }
  }

  async getRoleName(id: string): Promise<string> {
    // Doesn't actually do anything asynchronous, but is an async function for
    // consistency with most other functions in this class.

    return `in team: ${id}`
  }

  async getRole(id: string): Promise<discord.Role> {
    const roleName = await this.getRoleName(id)

    let role = this.game.guild.roles.find(role => role.name === roleName)

    if (role === null) {
      role = await this.game.guild.createRole({ name: roleName })
    }

    return role
  }

  async updateUserTeamRoles(id: string) {
    for (const battleCharacterId of await this.getMembers(id)) {
      await this._addUserToTeamRole(id, battleCharacterId)
    }
  }

  async _addUserToTeamRole(teamId: string, battleCharacterId: string) {
    const type = await this.game.battleCharacters.getCharacterType(battleCharacterId)

    if (type === 'user') {
      const role = await this.getRole(teamId)
      const id = await this.game.battleCharacters.getCharacterId(battleCharacterId)
      const member = await this.game.users.getDiscordMember(id)
      await member.addRole(role)
    }
  }

  async hasMember(id: string, member: string): Promise<boolean> {
    const members = await this.getMembers(id)
    return members.includes(member)
  }

  async findByMember(member: string): Promise<Array<string>> {
    return (await this.db.find({ members: { $elemMatch: member } }, { _id: 1 }))
      .map(team => team._id)
  }

  async removeMember(teamId: string, member: string) {
    await this.update(teamId, { $pull: { members: member } })
  }

  async findOrCreateForMember(member: string): Promise<string> {
    const find = await this.findByMember(member)

    let id

    if (find.length > 0) {
      id = find[0]
    } else {
      id = await this.createNew([ member ])
    }

    await this.updateUserTeamRoles(id)

    return id
  }

  async createNew(members: Array<string> = []): Promise<string> {
    const id = shortid.generate().toLowerCase()
    await this.add(id, { members })
    return id
  }
}
