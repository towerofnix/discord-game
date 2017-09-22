import User from './User'
import Discord from 'discord.js'
import { log } from './util'
import env from './env'

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

env('discord_token', 'string').then(token => client.login(token))
