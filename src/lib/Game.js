const discord = require('discord.js')
const chalk = require('chalk')

//const { User } = require('./User')
const { env } = require('./env')
const { log } = require('./util')
const { CommandController, RoomController, /*MusicController,*/
        UserController, EnemyController, TeamController,
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
      await this.users.add(member.id, { location: 'tiny-land', battleCharacter })

      await log.success(chalk`Added user: {cyan ${await this.users.getName(member.id)}}`)
    }
  }

  async createUsersForNewMembers() {
    let numAdded = 0

    for (const [ id, member ] of this.guild.members) {
      // if this user is a bot, ignore it
      if (member.user.bot === true)
        continue

      // is this user in the database?
      if (await this.users.has(id) === false) {
        await this.createUserForMember(member)
        numAdded++
      }
    }

    return numAdded
  }

  async setup() {
    this.battleCharacters = new BattleCharacterController(this)
    this.users = new UserController(this)
    this.teams = new TeamController(this)
    this.rooms = new RoomController(this)
    this.moves = new MoveController(this)
    this.enemies = new EnemyController(this)

    this.commands = new CommandController(this)
    this.commands.setupMessageListener()
    this.commands.addVerb('examine')

    this.commands.set('battle', async (rest, message) => {
      // TEMP
      console.log('Battle!')

      const userId = message.author.id
      const playerBattleCharacterId = await this.users.getBattleCharacter(userId)
      const team1Id = await this.teams.findOrCreateForMember(playerBattleCharacterId)

      const enemyId = 'think'
      const enemyBattleCharacterId = await this.battleCharacters.createForCharacter('ai', enemyId, 'Think', 'it')
      const team2Id = await this.teams.findOrCreateForMember(enemyBattleCharacterId)

      for (const member of [...await this.teams.getMembers(team1Id), ...await this.teams.getMembers(team2Id)]) {
        await this.battleCharacters.restoreHP(member)
      }

      const battle = new Battle([team1Id, team2Id])

      battle.start(this)
    })

    this.commands.set('duel', async (rest, message) => {
      // ALSO TEMP

      const userId = message.author.id
      const playerBattleCharacterId = await this.users.getBattleCharacter(userId)
      const userTeamId = await this.teams.findOrCreateForMember(playerBattleCharacterId)

      const opponentUserIdList = Array.from(message.mentions.members.values())

      // TODO: Use richWrite instead of message.reply.
      if (opponentUserIdList.length === 0) {
        message.reply('Please @-mention the user you want to duel.')
        return false
      }

      const opponentUserId = opponentUserIdList[0].id

      if (await this.users.has(opponentUserId) === false) {
        message.reply('That isn\'t a user you can duel! (They aren\'t in the user database.)')
        return false
      }

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


    // TODO: refactor lol
    return

    this.musicController = new MusicController(this)
  }

  async go() {
    const clientId = await env('discord_client_id', 'string')
    const perms = 0x00000008 // ADMINISTRATOR; bitwise OR with others if need be
    const addToServerURL = `https://discordapp.com/oauth2/authorize?&client_id=${clientId}&scope=bot&permissions=${perms}&response_type=code`
    await log.info(chalk`Add to server url: {underline {cyan ${addToServerURL}}}`)

    const token = await env('discord_token', 'string')
    await this.client.login(token)

    await this.cleanDiscordServer()
  }

  async cleanDiscordServer() {
    await log.info('Removing battle-related channels...')

    const battlesRemoved = (await Promise.all(this.guild.channels
      .filter(channel => channel.name.startsWith('battle-'))
      .map(channel => channel.delete())
    )).length

    if (battlesRemoved > 0) {
      await log.success(`Removed (${battlesRemoved}) battle channels`)
    } else {
      await log.info('No battle channels to remove')
    }

    await log.info('Removing team-related roles...')

    const rolesRemoved = (await Promise.all(this.guild.roles
      .filter(role => role.name.startsWith('in team:'))
      .map(role => role.delete())
    )).length

    if (rolesRemoved > 0) {
      await log.success(`Removed (${rolesRemoved}) role channels`)
    } else {
      await log.info('No team roles to remove')
    }
  }
}

module.exports = { Game }
