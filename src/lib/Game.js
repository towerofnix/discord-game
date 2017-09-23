'use strict'

const Discord = require('discord.js')
const camo = require('camo')
const chalk = require('chalk')

const { env } = require('./env')
const { log } = require('./util')

// TODO: Very bad! lib requiring from game is definitely not a good sign.
const { registerRooms } = require('../game/rooms/register-rooms')

class Game {
  constructor() {
    this.client = new Discord.Client
    this.client.on('ready', () => this.handleClientReady())
    this.client.on('guildMemberAdd', member => this.handleMemberJoin(member))
  }

  async handleClientReady() {
    await log.success('Connected to Discord API')

    global.guild = client.guilds.first() // assuming one and only!

    // New user check
    await log.info('Checking for any new users not yet in the database...')
    const newUserAmount = await User.addNewUsers()
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
      await log.success(chalk`Added user: {cyan ${await user.getName()}}`)
    }
  }

  async setup() {
    // TODO: registerRooms will be defined under a RoomController class.
    await registerRooms()
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
