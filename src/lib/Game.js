const discord = require('discord.js')
const chalk = require('chalk')

const { env } = require('./env')
const { log, showMenu } = require('./util')
const { CommandController, RoomController, MusicController,
        UserController, BattleAIController, TeamController,
        BattleCharacterController, MoveController } = require('./controllers')
const { Battle } = require('./Battle')

class Game {
  constructor() {
    this.client = new discord.Client()
    this.client.on('ready', () => this.handleClientReady())
    this.client.on('guildMemberAdd', member => this.handleMemberJoin(member))
  }

  async handleClientReady() {
    await log.success('Connected to Discord API')
    this.guild = this.client.guilds.first() // assumes one and only guild

    // New user check
    await log.info('Checking for any new members who don\'t yet have users in the database...')
    const newUserAmount = await this.createUsersForNewMembers()
    if (newUserAmount > 0)
      await log.success(`Added (${newUserAmount}) new users to the database`)
    else
      await log.info('No users to add')
  }

  async handleMemberJoin(member) {
    await this.createUserForMember(member)
  }

  async createUserForMember(member) {
    if (!member /* TODO: typecheck */) throw new TypeError('Game#createUserForMember(discord.GuildMember member) expected')

    if (await this.users.has(member.id) === false) { // quick sanity check
      // Add new user to the database
      await log.info('A new user just joined! Adding them to the database...')

      const battleCharacter = await this.battleCharacters.createForCharacter('user', member.id, member.displayName)
      await this.users.add(member.id, {
        location: 'lonely-void',
        listeningTo: 'lonely-void',
        battleCharacter,
      })

      await log.success(chalk`Added user: {cyan ${await this.users.getName(member.id)}}`)
    }
  }

  async createUsersForNewMembers() {
    let numAdded = 0

    await Promise.all(
      Array.from(this.guild.members.entries()).map(async ([ id, member ]) => {
        // if this user is a bot, ignore it
        if (member.user.bot === true) {
          return
        }

        // is this user in the database?
        if (await this.users.has(id) === false) {
          await this.createUserForMember(member)
          numAdded++
        }
      })
    )

    return numAdded
  }

  async setup() {
    await log.debug('Game#setup()')

    this.battleCharacters = new BattleCharacterController(this)
    this.users = new UserController(this)
    this.teams = new TeamController(this)
    this.rooms = new RoomController(this)
    this.moves = new MoveController(this)
    this.music = new MusicController(this)
    this.battleAIs = new BattleAIController(this)

    // check existing db schemas
    await this.battleCharacters.typecheckAll()
    await this.users.typecheckAll()
    await this.teams.typecheckAll()

    this.commands = new CommandController(this)
    this.commands.setupMessageListener()
    this.commands.addVerb('examine')

    this.commands.set('play', async (rest, message) => {
      // TEMP

      const userId = message.author.id
      await this.music.play(rest, userId)
    })

    this.commands.set('menu', async (rest, message) => {
      // TEMP AGAIN

      const userId = message.author.id

      showMenu(message.channel, userId, {
        start: 'root',
        dialogs: {
          root: {
            title: 'Root',
            action: async () => {
              await message.reply('Welcome to my AMAZING menu maze!')
            },
            options: [
              {title: 'Reference self', emoji: '🔄', action: {to: 'root'}},
              {title: 'Run-action', emoji: '🍔', action: async () => {
                await message.reply('Yeah, right!')
                return {to: 'root'}
              }},
              {title: 'Get outta here!', emoji: '🐻', action: async () => {
                await message.reply('Awww.')
                return {to: 'finalRegrets'}
              }},
              {title: 'Memeland', emoji: '💡', action: {to: 'memeland'}}
            ]
          },
          memeland: {
            title: 'Memeland',
            options: () => ['FACE', 'nah'].map((item, index) => {
              return {title: item, emoji: ['🎨', '📝'][index], action: {to: 'memeland'}}
            }).concat({title: 'Back to the past', emoji: '🔙', action: {history: 'back'}})
          },
          finalRegrets: {
            title: 'Final regrets?',
            options: [
              {title: 'I hate this stupid menu, let me leave.', emoji: '🔥'},
              {title: 'Actually...', emoji: '🤔', action: {to: 'root'}}
            ]
          }
        }
      })
    })

    this.commands.set('battle', async (rest, message) => {
      // TEMP
      log.info('Battle!')

      const userId = message.author.id
      const playerBattleCharacterId = await this.users.getBattleCharacter(userId)
      const team1Id = await this.teams.findOrCreateForMember(playerBattleCharacterId)

      for (const member of await this.teams.getMembers(team1Id)) {
        await this.battleCharacters.restoreHP(member)
      }

      const teams = [team1Id]
      for (const teamString of (rest || 'think').split(' ')) {
        const enemies = []
        for (const enemyAI of teamString.split(',')) {
          const ai = this.battleAIs.get(enemyAI)
          // TODO: Store enemy pronoun in AI type?
          enemies.push(await this.battleCharacters.createForCharacter('ai', enemyAI, ai && ai.name, 'it'))
        }
        teams.push(await this.teams.createNew(enemies))
      }

      const battle = new Battle(teams)

      battle.start(this)
    })

    const _getUserArgFromMessage = async message => {
      const userIdList = Array.from(message.mentions.members.values())

      // TODO: Use richWrite instead of message.reply.
      if (userIdList.length === 0) {
        message.reply('Please @-mention the user you want to target.')
        return false
      }

      const userId = userIdList[0].id

      if (await this.users.has(userId) === false) {
        message.reply('That isn\'t a user you can target! (They aren\'t in the user database.)')
        return false
      }

      return userId
    }

    this.commands.set('duel', async (rest, message) => {
      // ALSO TEMP

      const userId = message.author.id
      const playerBattleCharacterId = await this.users.getBattleCharacter(userId)
      const userTeamId = await this.teams.findOrCreateForMember(playerBattleCharacterId)

      const opponentUserId = await _getUserArgFromMessage(message)
      if (opponentUserId === false) return false

      const opponentBattleCharacterId = await this.users.getBattleCharacter(opponentUserId)

      // TODO: Get a "this user only" team. (This should be a new method on TeamController.)
      const opponentTeamId = await this.teams.findOrCreateForMember(opponentBattleCharacterId)

      for (const member of [...await this.teams.getMembers(userTeamId), ...await this.teams.getMembers(opponentTeamId)]) {
        await this.battleCharacters.restoreHP(member)
      }

      // Let the opponent go first! (This gives them a chance to think and look at the dueler
      // (the person who used this command).)
      const battle = new Battle([opponentTeamId, userTeamId])

      battle.start(this)
    })

    this.commands.set('warp', async (rest, message) => {
      // FURTHERMORE TEMP
      const location = rest

      if (this.rooms.has(location) === false) {
        message.reply('That location does not exist!')
        return false
      }

      const userId = message.author.id
      await this.users.setLocation(userId, location)
    })

    this.commands.set('summon-cool-npc-friend', async (rest, message) => {
      // ADDITIONALLY TEMP

      const userId = message.author.id
      const battleCharacterId = await this.users.getBattleCharacter(userId)
      const teamId = await this.teams.findOrCreateForMember(battleCharacterId)

      const choose = arrlike => arrlike[Math.floor(Math.random() * arrlike.length)]
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const name = choose(alphabet) + (choose('AEIOU') + choose(alphabet)).toLowerCase()
      const pronoun = choose(['she', 'he', 'they'])

      const aiId = rest || 'cool-npc-friend'

      const friendBattleCharacterId = await this.battleCharacters.createForCharacter('ai', rest || 'cool-npc-friend', name, pronoun)
      await this.teams.addMember(teamId, friendBattleCharacterId)

      message.reply(name + ' joins your team!')
    })

    this.commands.set('team', async (rest, message) => {
      // FURTHERMORE TEMP

      const userId = message.author.id
      const battleCharacterId = await this.users.getBattleCharacter(userId)
      const teamId = await this.teams.findOrCreateForMember(battleCharacterId)

      const otherUserId = await _getUserArgFromMessage(message)
      if (otherUserId === false) return false

      const otherBattleCharacterId = await this.users.getBattleCharacter(otherUserId)

      await this.teams.addMember(teamId, otherBattleCharacterId)

      message.reply('Teamed!')
    })
  }

  async go() {
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

  async cleanDiscordServer() {
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

module.exports = { Game }
