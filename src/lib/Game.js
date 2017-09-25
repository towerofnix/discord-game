const discord = require('discord.js')
const camo = require('camo')
const chalk = require('chalk')

const { User } = require('./User')
const { env } = require('./env')
const { log, promptOnMessage } = require('./util')
const { CommandController, BattleController, RoomController,
        MusicController } = require('./controllers')

class Game {
  constructor() {
    this.client = new discord.Client
    this.client.on('ready', () => this.handleClientReady())
    this.client.on('guildMemberAdd', member => this.handleMemberJoin(member))
  }

  async handleClientReady() {
    await log.success('Connected to Discord API')
    this.guild = this.client.guilds.first() // assumes one and only guild

    // Remove battle-related channels and roles, if any
    await log.info('Cleaning battle-related channels and roles...')
    const battlesCleaned = await this.battleController.cleanAll()
    if (battlesCleaned > 0)
      await log.success(`Cleaned (${battlesCleaned}) battles`)
    else
      await log.info('No battles to clean')


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

    if (await User.exists(member.id) === false) { // quick sanity check
      // Add new user to the database
      await log.info('A new user just joined! Adding them to the database...')
      const user = User.create({ _id: member.id })
      await user.save()
      await log.success(chalk`Added user: {cyan ${await user.getName(this.guild)}}`)

      // Add them to #lonely-void
      // TODO: assumes #lonely-void is the default room - bad!
      await this.roomController.moveUserToRoom('lonely-void', user)
    }
  }

  async createUsersForNewMembers() {
    let numAdded = 0

    for (const [ id, member ] of this.guild.members) {
      // if this user is a bot, ignore it
      if (member.user.bot === true)
        continue

      // is this user in the database?
      if (await User.exists(id) === false) {
        this.createUserForMember(member)
        numAdded++
      }
    }

    return numAdded
  }

  async setup() {
    // TODO: registerRooms will be defined under a RoomController class.
    // await registerRooms()

    this.commandController = new CommandController(this)
    this.battleController = new BattleController(this)
    this.roomController = new RoomController(this)
    this.musicController = new MusicController(this)
    this.setupVerbHandlers()
  }

  async go() {
    const dbUri = await env('database_uri', 'string', 'nedb://data/')
    await camo.connect(dbUri)
    await log.success('Connected to database')

    const clientId = await env('discord_client_id', 'string')
    const perms = 0x00000008 // ADMINISTRATOR; bitwise OR with others if need be
    const addToServerURL = `https://discordapp.com/oauth2/authorize?&client_id=${clientId}&scope=bot&permissions=${perms}&response_type=code`
    await log.info(chalk`Add to server url: {underline {cyan ${addToServerURL}}}`)

    const token = await env('discord_token', 'string')
    await this.client.login(token)
  }

  // Verb code ----------------------------------------------------------------
  // This should probably be moved to a VerbController class.

  setupVerbHandlers() {
    this.commandController.on('.examine', this.makeVerbHandler('examine'))
  }

  makeVerbHandler(verb) {
    if (!verb || typeof verb !== 'string') throw new TypeError('Game#makeVerbHandler(string verb) expected')

    return async (command, rest, message) => {
      const user = await User.getById(message.author.id)

      if (this.roomController.hasRoomById(user.currentRoom) === false) {
        log.warn(`User ${message.author.tag} attempted to use a verb while in nonexistant room "${user.currentRoom}"!`)
        return false
      }

      const room = this.roomController.getRoomById(user.currentRoom)
      const { channel } = await this.roomController.getRoomChannelAndRole(room)

      if (rest.length === 0) {
        const choices = await room.getVerbChoices(verb, user, this) || []
        const choice = await promptOnMessage(message, choices, user)
        await room.handleVerbChoice(verb, choice, user, this)
      } else {
        console.log('Look at that thing.')
      }
    }
  }
}

module.exports = { Game }
