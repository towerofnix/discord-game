import User from './User'
import Discord from 'discord.js'
import { log } from './util'
import env from './env'

process.on('uncaughtException', err => {
  log.inspect(err) // only shows on -1 loglevel [debug]
  log.fatal(err)
  process.exit(1)
})

process.on('unhandledRejection', err => {
  log.inspect(err) // only shows on -1 loglevel [debug]
  log.fatal(err)
  process.exit(1)
})

const client = new Discord.Client

client.on('ready', () => {
  log.success('Ready!')
})

env('discord_token', 'string').then(client.login)
