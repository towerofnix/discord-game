const { User } = require('./lib/User')
const { log } = require('./lib/util')
const { env } = require('./lib/env')

const Discord = require('discord.js')
const chalk = require('chalk')
const camo = require('camo')

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

console.log('going, lol')

env('database_uri', 'string', 'nedb://data/')
  .then(dbUri => camo.connect(dbUri))
  .then(() => log.success('Connected to database'))
  .then(() => env('discord_client_id', 'string'))
  .then(clientId => {
    const perms = 0x00000008 // ADMINISTRATOR; bitwise OR with others if need be
    return log.info(chalk`Add to server url: {underline {cyan https://discordapp.com/oauth2/authorize?&client_id=${clientId}&scope=bot&permissions=${perms}&response_type=code}}`)
  })
  .then(() => env('discord_token', 'string'))
    .then(token => client.login(token))
