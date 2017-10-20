// @flow

import discord from 'discord.js'
import chalk from 'chalk'

import env from './util/env'
import * as log from './util/log'
import showMenu from './util/showMenu'
import BattleAIController from './controllers/BattleAIController'
import BattleCharacterController from './controllers/BattleCharacterController'
import CommandController from './controllers/CommandController'
import MoveController from './controllers/MoveController'
import MusicController from './controllers/MusicController'
import RoomController from './controllers/RoomController'
import TeamController from './controllers/TeamController'
import UserController from './controllers/UserController'
import Battle from './Battle'

type Pvoid = Promise<void>

export default class Game {
  // The main bot connection to the Discord API.
  client: discord.Client

  // The guild that is used as the server the bot is joined to. There can only
  // be one guild (tm).
  guild: discord.Guild

  // The various controllers. These almost always act like maps.
  battleAIs: BattleAIController
  battleCharacters: BattleCharacterController
  commands: CommandController
  moves: MoveController
  music: MusicController
  rooms: RoomController
  teams: TeamController
  users: UserController

  constructor() {
    this.client = new discord.Client()
    this.client.on('ready', () => this.handleClientReady())
    this.client.on('guildMemberAdd', member => this.handleMemberJoin(member))
  }

  async handleClientReady(): Pvoid {
    await log.success('Connected to Discord API')
    this.guild = this.client.guilds.first() // Assumes one and only guild

    // New user check
    await log.info('Checking for any new members who don\'t yet have users in the database...')
    const newUserAmount = await this.createUsersForNewMembers()
    if (newUserAmount > 0)
      await log.success(`Added (${newUserAmount}) new users to the database`)
    else
      await log.info('No users to add')
  }

  async handleMemberJoin(member: discord.GuildMember): Pvoid {
    await this.createUserForMember(member)
  }

  async createUserForMember(member: discord.GuildMember): Pvoid {
    if (await this.users.has(member.id) === false) { // Quick sanity check
      // Add new user to the database
      await log.info('A new user just joined! Adding them to the database...')

      const battleCharacter = await this.battleCharacters.createForCharacter('user', member.id, {
        name: member.displayName,
      })

      await this.users.add(member.id, {
        location: 'lonely-void',
        listeningTo: 'lonely-void',
        battleCharacter,
      })

      await log.success(chalk`Added user: {cyan ${await this.users.getName(member.id)}}`)
    }
  }

  async createUsersForNewMembers(): Promise<number> {
    let numAdded = 0

    await Promise.all(
      Array.from(this.guild.members.entries()).map(async ([ id, member ]: [ string, discord.Member ]): Pvoid => {
        // If this user is a bot, ignore it
        if (member.user.bot === true) {
          return
        }

        // Is this user in the database?
        if (await this.users.has(id) === false) {
          await this.createUserForMember(member)
          numAdded++
        }
      })
    )

    return numAdded
  }

  async setup(): Pvoid {
    await log.debug('Game#setup()')

    this.battleCharacters = new BattleCharacterController(this)
    this.users = new UserController(this)
    this.teams = new TeamController(this)
    this.rooms = new RoomController(this)
    this.moves = new MoveController(this)
    this.music = new MusicController(this)
    this.battleAIs = new BattleAIController(this)

    // Check existing db schemas
    await this.battleCharacters.typecheckAll()
    await this.users.typecheckAll()
    await this.teams.typecheckAll()

    this.commands = new CommandController(this)
    this.commands.setupMessageListener()
    this.commands.addVerb('examine')

    this.commands.set('play', async (rest: string, message: discord.Message): Pvoid => {
      // TEMP

      const userId = message.author.id
      await this.users.setListeningTo(userId, rest)
    })

    this.commands.set('pages', async (rest: string, message: discord.Message): Pvoid => {
      // TEMP ONCE MORE

      const userId = message.author.id

      const reply = text => () => message.reply(text)

      showMenu(message.channel, userId, {
        start: 'multipage',
        dialogs: {
          'multipage': {
            title: 'Multi-page dialog',
            options: [
              { title: 'Spaghetti!', emoji: '🍝', action: reply('Spaghetti!') }
            ],
            pages: [
              [
                { title: 'P1 O1', emoji: '🔄', action: reply('P1 O1') },
                { title: 'P1 O2', emoji: '🍔', action: reply('P1 O2') }
              ],
              [
                { title: 'P2 O1', emoji: '🐻', action: reply('P2 O1') },
                { title: 'P2 O2', emoji: '💡', action: reply('P2 O2') }
              ]
            ]
          }
        }
      })
    })

    this.commands.set('menu', async (rest: string, message: discord.Message): Pvoid => {
      // TEMP AGAIN

      const userId = message.author.id

      showMenu(message.channel, userId, {
        start: 'root',
        showBack: true,
        dialogs: {
          root: {
            title: 'Root',
            action: async (): Pvoid => {
              await message.reply('Welcome to my AMAZING menu maze!')
            },
            options: [
              { title: 'Reference self', emoji: '🔄', action: { to: 'root' } },
              { title: 'Run-action', emoji: '🍔', action: async (): Promise<Object> => {
                await message.reply('Yeah, right!')
                return { to: 'root' }
              } },
              { title: 'Get outta here!', emoji: '🐻', action: async (): Promise<Object> => {
                await message.reply('Awww.')
                return { to: 'finalRegrets' }
              } },
              { title: 'Memeland', emoji: '💡', action: { to: 'memeland' } }
            ]
          },
          memeland: {
            title: 'Memeland',
            options: () => [ 'FACE', 'nah' ].map((item, index) => ({ title: item, emoji: [ '🎨', '📝' ][index], action: { to: 'memeland' } })).concat({ title: 'Back to the past', emoji: '🔙', action: { history: 'back' } })
          },
          finalRegrets: {
            title: 'Final regrets?',
            options: [
              { title: 'I hate this stupid menu, let me leave.', emoji: '🔥' },
              { title: 'Actually...', emoji: '🤔', action: { to: 'root' } }
            ]
          }
        }
      })
    })

    this.commands.set('battle', async (rest: string, message: discord.Message): Pvoid => {
      // TEMP
      log.info('Battle!')

      const userId = message.author.id
      const playerBattleCharacterId = await this.users.getBattleCharacter(userId)
      const team1Id = await this.teams.findOrCreateForMember(playerBattleCharacterId)

      for (const member of await this.teams.getMembers(team1Id)) {
        await this.battleCharacters.restoreHP(member)
      }

      const teams = [ team1Id ]
      for (const teamString of (rest || 'think').split(' ')) {
        const enemies = []
        for (const enemyAI of teamString.split(',')) {
          const ai = this.battleAIs.get(enemyAI)
          enemies.push(await this.battleCharacters.createForCharacter('ai', enemyAI, Object.assign({
            name: ai && ai.name,
            pronoun: 'it'
          }, await ai.getDefaultBattleCharacter())))
        }
        teams.push(await this.teams.createNew(enemies))
      }

      const battle = new Battle(this, teams)

      battle.start()
    })

    const _getUserArgFromMessage = async (message: discord.Message): Promise<string | void> => {
      const userIdList = Array.from(message.mentions.members.values())

      // TODO: Use richWrite instead of message.reply.
      if (userIdList.length === 0) {
        message.reply('Please @-mention the user you want to target.')
        return
      }

      const userId = userIdList[0].id

      if (await this.users.has(userId) === false) {
        message.reply('That isn\'t a user you can target! (They aren\'t in the user database.)')
        return
      }

      return userId
    }

    this.commands.set('duel', async (rest: string, message: discord.Message): Pvoid => {
      // ALSO TEMP

      const userId = message.author.id
      const playerBattleCharacterId = await this.users.getBattleCharacter(userId)
      const userTeamId = await this.teams.findOrCreateForMember(playerBattleCharacterId)

      const opponentUserId = await _getUserArgFromMessage(message)

      if (opponentUserId === undefined) {
        return
      }

      const opponentBattleCharacterId = await this.users.getBattleCharacter(opponentUserId)

      // TODO: Get a "this user only" team. (This should be a new method on TeamController.)
      const opponentTeamId = await this.teams.findOrCreateForMember(opponentBattleCharacterId)

      for (const member of [ ...await this.teams.getMembers(userTeamId), ...await this.teams.getMembers(opponentTeamId) ]) {
        await this.battleCharacters.restoreHP(member)
      }

      // Let the opponent go first! (This gives them a chance to think and look at the dueler
      // (the person who used this command).)
      const battle = new Battle(this, [ opponentTeamId, userTeamId ])

      battle.start()
    })

    this.commands.set('warp', async (rest: string, message: discord.Message): Pvoid => {
      // FURTHERMORE TEMP
      const location = rest

      if (this.rooms.has(location) === false) {
        message.reply('That location does not exist!')
        return
      }

      const userId = message.author.id
      await this.users.setLocation(userId, location)
    })

    this.commands.set('summon-cool-npc-friend', async (rest: string, message: discord.Message): Pvoid => {
      // ADDITIONALLY TEMP

      const userId = message.author.id
      const battleCharacterId = await this.users.getBattleCharacter(userId)
      const teamId = await this.teams.findOrCreateForMember(battleCharacterId)

      const choose = arrlike => arrlike[Math.floor(Math.random() * arrlike.length)]
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const name = choose(alphabet) + (choose('AEIOU') + choose(alphabet)).toLowerCase()
      const pronoun = choose([ 'she', 'he', 'they' ])

      const friendBattleCharacterId = await this.battleCharacters.createForCharacter('ai', rest || 'cool-npc-friend', {
        name, pronoun
      })

      await this.teams.addMember(teamId, friendBattleCharacterId)

      message.reply(name + ' joins your team!')
    })

    this.commands.set('team', async (rest: string, message: discord.Message): Pvoid => {
      // UNSURPRISINGLY TEMP

      const userId = message.author.id
      const battleCharacterId = await this.users.getBattleCharacter(userId)

      let currentTeamId: string
      let currentMemberId: string

      await showMenu(message.channel, userId, {
        start: 'root',
        showBack: true,
        dialogs: {
          'root': {
            title: 'Teams',
            options: async () => [
              { title: 'Close', emoji: '❎' },
              // {title: 'View invites', emoji: '💌'},
              { title: 'Create new team', emoji: '🚀', action: { to: 'create new team' } }
            ],
            autopageOptions: async () => (await this.teams.findByMember(battleCharacterId))
              .map(teamId => ({ title: '(Team name here)', action: (): Object => {
                currentTeamId = teamId
                return { to: 'manage current team' }
              } }))
          },
          'create new team': {
            action: async (): Promise<Object> => {
              const teamId = await this.teams.createNew([ battleCharacterId ])
              currentTeamId = teamId
              return { history: 'pop', to: 'manage current team' }
            }
          },
          'manage current team': {
            title: '(Team name here)',
            options: [
              { title: '~~Invite~~ Add a new member', emoji: '💌', action: { to: 'invite new member' } },
              { title: 'Delete team', emoji: '🗑', action: { to: 'delete team' } }
            ],
            autopageOptions: async (): Promise<Array<Object>> => {
              const members = await this.teams.getMembers(currentTeamId)
              return await Promise.all(members.map(async (memberId: string): Promise<Object> => {
                const name = await this.battleCharacters.getName(memberId)
                return { title: name, action: async (): Promise<Object> => {
                  currentMemberId = memberId
                  return { to: 'manage member' }
                } }
              }))
            }
          },
          'invite new member': {
            title: '(Team name here) - Which member? (The person you want to invite must be in the same location as you.)',
            autopageOptions: async (): Promise<Array<Object>> => {
              const options = []

              const location = await this.users.getLocation(userId)
              const usersInLocation = await this.users.findByLocation(location)

              for (const userId of usersInLocation) {
                const memberId = await this.users.getBattleCharacter(userId)

                // Don't list users who are already in the team as options.
                if (await this.teams.hasMember(currentTeamId, memberId)) {
                  continue
                }

                const name = await this.battleCharacters.getName(memberId)

                options.push({ title: name, action: async (): Promise<Object> => {
                  await this.teams.addMember(currentTeamId, memberId)
                  return { history: 'back' }
                } })
              }

              return options
            }
          },
          'delete team': {
            action: async (): Promise<Object> => {
              await this.teams.delete(currentTeamId)
              return { history: 'clear', to: 'root' }
            }
          },
          'manage member': {
            title: async () => `(Team name here) - ${await this.battleCharacters.getName(currentMemberId)}`,
            options: [
              { title: 'Remove from team', emoji: '👋', action: async (): Promise<Object> => {
                await this.teams.removeMember(currentTeamId, currentMemberId)
                return { history: 'back' }
              } }
            ]
          }
        }
      })
    })

    this.commands.set('team-add', async (rest: string, message: discord.Message): Pvoid => {
      // FURTHERMORE TEMP

      const userId = message.author.id
      const battleCharacterId = await this.users.getBattleCharacter(userId)
      const teamId = await this.teams.findOrCreateForMember(battleCharacterId)

      const otherUserId = await _getUserArgFromMessage(message)

      if (otherUserId === undefined) {
        return
      }

      const otherBattleCharacterId = await this.users.getBattleCharacter(otherUserId)

      await this.teams.addMember(teamId, otherBattleCharacterId)

      message.reply('Teamed!')
    })
  }

  async go(): Pvoid {
    await log.debug('Game#go()')

    const clientId = await env('discord_client_id', 'string')
    const perms = 0x00000008 // ADMINISTRATOR; bitwise OR with others if need be
    const addToServerURL = `https://discordapp.com/oauth2/authorize?&client_id=${clientId}&scope=bot&permissions=${perms}&response_type=code`
    await log.info(chalk`Add to server url: {underline {cyan ${addToServerURL}}}`)

    const token = await env('discord_token', 'string')
    await this.client.login(token)

    await this.cleanDiscordServer()
    if (await env('music_enabled', 'boolean') === true) await this.music.playMusic()
    await this.music.giveRoles()
    await log.success('Ready')
  }

  async cleanDiscordServer(): Pvoid {
    // Battle-related channels
    {
      await log.info('Removing battle-related channels...')

      const removed = (await Promise.all(this.guild.channels
        .filter(channel => channel.name.startsWith('battle-'))
        .map(channel => channel.delete())
      )).length

      if (removed > 0) {
        await log.success(`Removed (${removed}) battle channels`)
      } else {
        await log.info('No battle channels to remove')
      }
    }

    // Team-related roles
    {
      await log.info('Removing team-related roles...')

      const removed = (await Promise.all(this.guild.roles
        .filter(role => role.name.startsWith('in team:'))
        .map(role => role.delete())
      )).length

      if (removed > 0) {
        await log.success(`Removed (${removed}) team roles`)
      } else {
        await log.info('No team roles to remove')
      }
    }

    // Music-related channels
    {
      await log.info('Removing music-related channels...')

      const removed = (await Promise.all(this.guild.channels
        .filter(channel => channel.name.startsWith('music-'))
        .filter(channel => !this.music.songs.has(channel.name.substr(6)))
        .map(channel => channel.delete())
      )).length

      if (removed > 0) {
        await log.success(`Removed (${removed}) music channels`)
      } else {
        await log.info('No music channels to remove')
      }
    }

    // Music-related roles
    {
      await log.info('Removing music-related roles...')

      const removed = (await Promise.all(this.guild.roles
        .filter(role => role.name.startsWith('listening to:'))
        .filter(role => !this.music.songs.has(role.name.substr(14)))
        .map(role => role.delete())
      )).length

      if (removed > 0) {
        await log.success(`Removed (${removed}) music roles`)
      } else {
        await log.info('No music roles to remove')
      }
    }
  }
}
