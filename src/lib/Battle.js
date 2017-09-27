const { log, prompt } = require('./util')
const { User } = require('./User')
const { Enemy } = require('./Enemy')
const attacks = require('../game/moves/attacks')

const chalk = require('chalk')
const shortid = require('shortid')
const discord = require('discord.js')

class Battle {
  constructor(teamA, teamB) {
    if (!teamA || !Array.isArray(teamA) || teamA.length == 0)
      throw new TypeError('new Battle(array<User|Enemy> teamA) expected')
    if (!teamB || !Array.isArray(teamB) || teamB.length == 0)
      throw new TypeError('new Battle(, array<User|Enemy> teamB) expected')

    this.id = shortid.generate().toLowerCase()
    this.teamA = teamA
    this.teamB = teamB

    this.started = false
    this.channel = null
  }

  async start(game) {
    if (!game) throw new TypeError('Battle#start(Game game) expected')
    if (this.started) throw new Error('Battle#start() already started')
    this.started = true

    const guild = game.guild

    const everyoneRole = guild.id
    this.teamARole = await guild.createRole({ name: `in battle: ${this.id} a` })
    this.teamBRole = await guild.createRole({ name: `in battle: ${this.id} b` })

    this.teamAChannel = await guild.createChannel(`battle-a-${this.id}`, 'text', [
      { id: everyoneRole, deny: 3136, allow: 0 }, // @everyone -rw -react
      { id: this.teamARole.id, deny: 0, allow: 3072 }, // team A +rw
    ])

    this.teamBChannel = await guild.createChannel(`battle-b-${this.id}`, 'text', [
      { id: everyoneRole, deny: 3136, allow: 0 }, // @everyone -rw -react
      { id: this.teamBRole.id, deny: 0, allow: 3072 }, // team B +rw
    ])

    // TODO spectator channel?
    // TODO header image

    for (let entity of this.teamA) {
      if (entity instanceof User) {
        await game.musicController.play('battle', entity)
        await (await entity.getMember(guild)).addRole(this.teamARole)
      }
    }

    for (let entity of this.teamB) {
      if (entity instanceof User) {
        await game.musicController.play('battle', entity)
        await (await entity.getMember(guild)).addRole(this.teamARole)
      }
    }

    return await this.teamATurn(guild)
  }

  async getUserAction(user, guild) {
    if (!user || user instanceof User === false) throw new TypeError('Battle#getUserAction(User user) expected')
    if (!guild || guild instanceof discord.Guild === false) throw new TypeError('Battle#getUserAction(, discord.Guild guild) expected')

    // TODO: Go here!! TODO TODO TODO TODO TODO.

    const userMoves = {
      skipTurn: [ 'Skip Turn', '⚓' ],
      tactics: [ 'Tactics', '🏴' ],
      items: [ 'Items',   '🌂' ],
      attacks: [ 'Attacks', '🥊' ]
    }

    // TEMP, user should be able to learn attacks and stuff
    const userAttacks = [
      new attacks.Tackle
    ]

    const member = await user.getMember(guild)

    switch (await prompt(this.teamAChannel, user, `${member.displayName}'s Turn`, userMoves)) {
      case 'attacks': {
        const choices = new Map(userAttacks.map(atk => [atk, [atk.name, atk.emoji]]))
        const choice = await prompt(this.teamAChannel, user, `${member.displayName}'s Turn - Attacks`, choices)
        return { type: 'attack', attack: choice }
      }

      // case 'items': {}
      // case 'tactics': {}

      case 'skipTurn': {
        return { type: 'skip turn' }
      }

      default: {
        log.warn('User selected a non-implemented battle action!')
        return { type: 'skip turn' }
      }
    }
  }

  async teamATurn(guild) {
    if (!guild || guild instanceof discord.Guild === false) throw new TypeError('Battle#teamATurn(discord.Guild guild) expected')

    for (let entity of this.teamA) {
      await this.getUserAction(entity, guild)
    }
  }
}

module.exports = { Battle }
