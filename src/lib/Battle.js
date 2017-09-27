const { log, prompt } = require('./util')
const { User } = require('./User')
const { Enemy } = require('./Enemy')
const attacks = require('../game/moves/attacks')

const chalk = require('chalk')
const shortid = require('shortid')
const discord = require('discord.js')

class Battle {
  constructor(teams) {
    if (!teams || !Array.isArray(teams)) throw new TypeError('new Battle(array<Team> teams) expected')
    if (teams.length < 2) throw new TypeError('At least two teams expected')

    this.id = shortid.generate().toLowerCase()
    this.teams = teams

    this.channelMap = new Map()
    this.started = false
    this.channel = null
  }

  async start(game) {
    if (!game) throw new TypeError('Battle#start(Game game) expected')
    if (this.started) throw new Error('Battle#start() already started')
    this.started = true

    const guild = game.guild

    const everyoneRole = guild.id

    for (const team of this.teams) {
      this.channelMap.set(team, await guild.createChannel(`battle-${this.id}-team-${team.id}`, 'text', [
        { id: everyoneRole, deny: 3136, allow: 0}, // @everyone -rw -react
        { id: (await team.getRole(game.guild)).id, deny: 0, allow: 3072 }, // team +rw
      ]))
    }

    for (const team of this.teams) {
      for (const { entity } of team) {
        if (entity instanceof User) {
          await game.musicController.play('battle', entity)
        }
      }
    }

    // TODO spectator channel?
    // TODO header image

    // TODO: Run the first turn
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
