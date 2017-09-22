import User from './User'
import Discord from 'discord.js'
import { log } from './util'
import env from './env'
import chalk from 'chalk'

process.on('uncaughtException', async err => {
  if (typeof err === 'object') await log.inspect(err) // only shows on -1 loglevel [debug]
  await log.fatal(err)
})

process.on('unhandledRejection', async err => {
  if (typeof err === 'object') await log.inspect(err) // only shows on -1 loglevel [debug]
  await log.fatal(err)
})

const client = new Discord.Client

client.on('ready', async () => {
  await log.success('Connected to Discord API')
})

env('discord_client_id', 'string').then(clientId => {
  const perms = 0x00000008 // ADMINISTRATOR; bitwise OR with others if need be
  return log.info(chalk`Add to server url: {underline {cyan https://discordapp.com/oauth2/authorize?&client_id=${clientId}&scope=bot&permissions=${perms}&response_type=code}}`)
}).then(() => env('discord_token', 'string'))
  .then(token => client.login(token))
