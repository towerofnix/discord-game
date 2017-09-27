const { log, prompt } = require('./util')
const { User } = require('./User')
const { Enemy } = require('./Enemy')
const { BattleCharacter } = require('./BattleCharacter')
const { Team } = require('./Team')
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

    this.currentTeamIndex = 0
    this.currentCharacterIndex = 0
  }

  async start(game) {
    if (!game) throw new TypeError('Battle#start(Game game) expected')
    if (this.started) throw new Error('Battle#start() already started')
    this.started = true

    this.guild = game.guild

    const everyoneRole = this.guild.id

    for (const team of this.teams) {
      this.channelMap.set(team, await this.guild.createChannel(`battle-${this.id}-team-${team.id}`, 'text', [
        { id: everyoneRole, deny: 3136, allow: 0}, // @everyone -rw -react
        { id: (await team.getRole(this.guild)).id, deny: 0, allow: 3072 }, // team +rw
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

    await this.runBattleLoop()
  }

  async runBattleLoop() {
    await this.runCurrentTurn()
    this.nextBattleCharacter()
    await this.runBattleLoop()
  }

  async runCurrentTurn() {
    const action = await this.getBattleCharacterAction(this.currentBattleCharacter, this.currentTeam)
    console.log(action)
  }

  nextBattleCharacter() {
    const currentTeam = this.currentTeam

    if (this.currentCharacterIndex + 1 === currentTeam.battleCharacters.length) {
      this.currentCharacterIndex = 0

      if (this.currentTeamIndex + 1 === this.teams.length) {
        this.currentTeamIndex = 0
      } else {
        this.currentTeamIndex++
      }
    } else {
      this.currentTeamIndex++
    }
  }

  get currentTeam() {
    return this.teams[this.currentTeamIndex]
  }

  get currentBattleCharacter() {
    return this.currentTeam.battleCharacters[this.currentCharacterIndex]
  }

  async getBattleCharacterAction(battleCharacter, team) {
    if (!battleCharacter || battleCharacter instanceof BattleCharacter === false) throw new TypeError('Battle#getBattleCharacterAction(BattleCharacter battleCharacter) expected') // :yougotit:
    if (!team || team instanceof Team === false) throw new TypeError('Battle#getBattleCharacterAction(, Team team) expected')

    const { entity } = battleCharacter

    if (entity instanceof User) {
      return await this.getUserAction(entity, team)
    } else {
      // TODO: AI turn picking
      return { type: 'skip turn' }
    }
  }

  async getUserAction(user, team) {
    if (!user || user instanceof User === false) throw new TypeError('Battle#getUserAction(User user) expected')
    if (!team || team instanceof Team === false) throw new TypeError('Battle#getUserAction(, Team team) expected')

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

    const member = await user.getMember(this.guild)

    const channel = this.channelMap.get(team)

    switch (await prompt(channel, user, `${member.displayName}'s Turn`, userMoves)) {
      case 'attacks': {
        const choices = new Map(userAttacks.map(atk => [atk, [atk.name, atk.emoji]]))
        const choice = await prompt(channel, user, `${member.displayName}'s Turn - Attacks`, choices)
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
}

module.exports = { Battle }
