const { User } = require('./lib/User')
const { log } = require('./lib/util')
const { env } = require('./lib/env')
const { registerRooms } = require('./game/rooms/register-rooms')

const Discord = require('discord.js')
const chalk = require('chalk')
const camo = require('camo')

async function main() {
  process.on('uncaughtException', async err => {
    if (typeof err === 'object') await log.inspect(err) // only shows on -1 loglevel [debug]
    await log.fatal(err)
  })

  process.on('unhandledRejection', async err => {
    if (typeof err === 'object') await log.inspect(err) // only shows on -1 loglevel [debug]
    await log.fatal(err)
  })

  global.client = new Discord.Client

  client.on('ready', async () => {
    await log.success('Connected to Discord API')

    global.guild = client.guilds.first() // assuming one and only!

    // New user check
    await log.info('Checking for any new users not yet in the database...')
    const newUserAmount = await User.addNewUsers()
    if (newUserAmount > 0)
      await log.success(`Added (${newUserAmount}) new users to the database`)
    else
      await log.info('No users to add')
  })

  client.on('guildMemberAdd', async member => {
    if (await User.exists(member.id) === false) { // quick sanity check
      // Add new user to the database
      await log.info('A new user just joined! Adding them to the database...')
      const user = User.create({ _id: member.id })
      await user.save()
      await log.success(chalk`Added user: {cyan ${await user.getName()}}`)
    }
  })

  await registerRooms()

  const dbUri = await env('database_uri', 'string', 'nedb://data/')
  await camo.connect(dbUri)
  await log.success('Connected to database')

  const clientId = await env('discord_client_id', 'string')
  const perms = 0x00000008 // ADMINISTRATOR; bitwise OR with others if need be
  const addToServerURL = `https://discordapp.com/oauth2/authorize?&client_id=${clientId}&scope=bot&permissions=${perms}&response_type=code`
  await log.info(chalk`Add to server url: {underline {cyan ${addToServerURL}}}`)

  const token = await env('discord_token', 'string')
  await client.login(token)
}

module.exports = {main}

if (require.main === module) {
  main()
}
