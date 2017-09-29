const { log, prompt, richWrite, delay } = require('./util')
const { User } = require('./User')
const { Enemy } = require('./Enemy')
const { BattleCharacter } = require('./BattleCharacter')
const { Team } = require('./Team')
const { BattleMove } = require('./BattleMove')
const { Attack } = require('./Attack')

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

    this.currentTeamId = null
    this.currentCharacterId = null
  }

  async start(game) {
    if (!game) throw new TypeError('Battle#start(Game game) expected')
    if (this.started) throw new Error('Battle#start() already started')
    this.started = true

    this.game = game

    const everyoneRole = this.game.guild.id

    for (const teamId of this.teams) {
      const teamRole = await this.game.teams.getRole(teamId)

      this.channelMap.set(teamId, await this.game.guild.createChannel(`battle-${this.id}-team-${teamId}`, 'text', [
        { id: everyoneRole, deny: 3136, allow: 0}, // @everyone -rw -react
        { id: teamRole.id, deny: 0, allow: 3072 }, // team +rw
      ]))
    }

    // TODO: Music
    /*
    for (const team of this.teams) {
      for (const { entity } of team) {
        if (entity instanceof User) {
          await game.musicController.play('battle', entity)
        }
      }
    }
    */

    // TODO spectator channel?
    // TODO header image

    this.currentTeamId = this.teams[0]
    this.currentCharacterId = (await this.game.teams.getMembers(this.currentTeamId))[0]

    await this.runBattleLoop()
  }

  async runBattleLoop() {
    while (true) {
      await this.runCurrentTurn()
      this.nextBattleCharacter()
      await delay(800)
    }
  }

  async runCurrentTurn() {
    const action = await this.getBattleCharacterAction(this.currentCharacterId, this.currentTeamId)

    if (action.type === 'use move') {
      const title = `${await this.game.battleCharacters.getName(this.currentCharacterId)} - ${action.move.name}`

      await this.writeToAllChannels(0xD79999, title, await action.move.getActionString(this.currentCharacterId, action.target))
      await delay(800)

      if (action instanceof Attack) {
        // TODO: Attacks
        // const damage = action.target.takeDamage(action.move.power)
        // await this.writeToAllChannels(0xD79999, title, `Deals ${damage} damage.`)
      }
    }
  }

  async nextBattleCharacter() {
    const currentTeamMembers = await this.game.teams.getMembers(this.currentTeamId)
    const index = currentTeamMembers.indexOf(this.currentCharacterId)

    if (index + 1 >= currentTeamMembers.length) {
      await this.nextTeam()
    } else {
      this.currentCharacterId = currentTeamMembers[index + 1]
    }
  }

  async nextTeam() {
    const index = this.teams.indexOf(this.currentTeamId)

    if (index + 1 >= this.teams.length) {
      this.currentTeamId = this.teams[0]
    } else {
      this.currentTeamId = this.teams[index + 1]
    }

    const currentTeamMembers = await this.game.teams.getMembers(this.currentTeamId)
    this.currentCharacterId = currentTeamMembers[0]
  }

  get currentTeam() {
    throw new Error('get currentTeam is obsolete!')
  }

  get currentBattleCharacter() {
    throw new Error('get currentBattleCharacter is obsolete!')
  }

  async getBattleCharacterAction(battleCharacterId, teamId) {
    if (!battleCharacterId || typeof battleCharacterId !== 'string') throw new TypeError('Battle#getBattleCharacterAction(string battleCharacterId) expected')
    if (!teamId || typeof teamId !== 'string') throw new TypeError('Battle#getBattleCharacterAction(, string teamId) expected')

    const characterType = await this.game.battleCharacters.getCharacterType(battleCharacterId)

    if (characterType === 'user') {
      return await this.getUserAction(battleCharacterId, teamId)
    } else {
      // TODO: AI turn picking
      return { type: 'use move', move: this.game.moves.get('skip-turn') }
    }
  }

  async getUserAction(battleCharacterId, teamId) {
    if (!battleCharacterId || typeof battleCharacterId !== 'string') throw new TypeError('Battle#getUserAction(string battleCharacterId) expected')
    if (!teamId || typeof teamId !== 'string') throw new TypeError('Battle#getUserAction(, string teamId) expected')

    const userMoves = {
      skipTurn: [ 'Skip Turn', '⚓' ],
      tactics: [ 'Tactics', '🏴' ],
      items: [ 'Items',   '🌂' ],
      attacks: [ 'Attacks', '🥊' ]
    }

    // TEMP, user should be able to learn attacks and stuff
    // TODO: Move to attacks map stored on game
    const userAttacks = ['tackle']

    const userId = await this.game.battleCharacters.getCharacterId(battleCharacterId)
    const member = await this.game.users.getDiscordMember(userId)
    const channel = this.channelMap.get(teamId)

    switch (await prompt(channel, userId, `${member.displayName}'s Turn`, userMoves)) {
      case 'attacks': {
        const choices = new Map(userAttacks.map(attackId => {
          const move = this.game.moves.get(attackId)
          return [move, [move.name, move.emoji]]
        }))
        const move = await prompt(channel, userId, `${member.displayName}'s Turn - Attacks`, choices)
        const target = await this.getUserTarget(userId, teamId, move)
        return { type: 'use move', move, target }
      }

      // case 'items': {}
      // case 'tactics': {}

      case 'skipTurn':
      default: {
        return { type: 'use move', move: this.game.moves.get('skip-turn') }
      }
    }
  }

  async getUserTarget(userId, teamId, move) {
    // TODO: Multi-page prompt function. We can use :heart:s for five options
    // per page, but when there's more than five possible choices, that won't
    // work.

    if (!userId || typeof userId !== 'string') throw new TypeError('Battle#getUserTarget(string userId) expected')
    if (!teamId || typeof teamId !== 'string') throw new TypeError('Battle#getUserTarget(, string teamId) expected')
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#getUserTarget(,, BattleMove move) expected')

    const allCharacters = this.teams.map(team => team.battleCharacters)
      .reduce((a, b) => a.concat(b), [])

    const characters = []
    for (const teamId of this.teams) {
      const members = await this.game.teams.getMembers(teamId)
      for (const battleCharacterId of members) {
        characters.push([battleCharacterId, await this.game.battleCharacters.getName(battleCharacterId)])
      }
    }

    const choices = new Map(characters.map(([ id, name ], i) => {
      return [
        id,
        [name, [
          '♥', '💙', '💚', '💛', '💜',
          '🥕', '🥔', '🍆'
        ][i]]
      ]
    }))

    const channel = this.channelMap.get(teamId)

    return await prompt(channel, userId, `${await this.game.users.getName(userId)}'s turn - use ${move.name} on who?`, choices)
  }

  writeToAllChannels(color, title, content) {
    return Promise.all(Array.from(this.channelMap.values()).map(channel => {
      richWrite(channel, color, title, content)
    }))
  }
}

module.exports = { Battle }
