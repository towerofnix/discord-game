const discord = require('discord.js')
const camo = require('camo')
const chalk = require('chalk')

const { User } = require('./User')
const { env } = require('./env')
const { log } = require('./util')
const { CommandController, BattleController, RoomController } = require('./controllers')

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
    await log.info('Checking for any new users not yet in the database...')
    const newUserAmount = await User.addNewUsers(this.guild.members)
    if (newUserAmount > 0)
      await log.success(`Added (${newUserAmount}) new users to the database`)
    else
      await log.info('No users to add')
  }

  async handleMemberJoin(member) {
    if (await User.exists(member.id) === false) { // quick sanity check
      // Add new user to the database
      await log.info('A new user just joined! Adding them to the database...')
      const user = User.create({ _id: member.id })
      await user.save()
      await log.success(chalk`Added user: {cyan ${await user.getName(this.guild)}}`)
    }
  }

  async setup() {
    // TODO: registerRooms will be defined under a RoomController class.
    // await registerRooms()

    this.commandController = new CommandController(this)
    this.battleController = new BattleController(this)
    this.roomController = new RoomController(this)
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
}

module.exports = { Game }
