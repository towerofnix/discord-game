const { log, temporaryPrompt, richWrite, delay } = require('./util')
const { BattleMove } = require('./BattleMove')

const chalk = require('chalk')
const shortid = require('shortid')
const discord = require('discord.js')

// Stupid fix for alex :)
const promptColor = 0x00AE86

class Battle {
  constructor(teams) {
    if (!teams || !Array.isArray(teams)) throw new TypeError('new Battle(array<Team> teams) expected')
    if (teams.length < 2) throw new TypeError('At least two teams expected')

    this.id = shortid.generate().toLowerCase()
    this.teams = teams

    this.channelMap = new Map()
    this.started = false
    this.temporaryEffects = new Map() // Map of character ID -> {attack, defense, poison, ...} temporary effects

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
    while (await this.getShouldContinueBattle()) {
      await this.runCurrentTurn()
      this.nextBattleCharacter()
      await delay(800)
    }

    const aliveTeams = await this.getAliveTeams()

    if (aliveTeams.length === 1) {
      const firstMember = (await this.game.teams.getMembers(aliveTeams[0]))[0]
      const name = await this.game.battleCharacters.getName(firstMember)
      await this.writeToAllChannels(0x4488EE, 'Battle results', `The team of ${name} won!`)
    } else if (aliveTeams.length === 0) {
      await this.writeToAllChannels(0x4488EE, 'Battle results', 'No teams survived.')
    }

    await delay(800)
    await this.writeToAllChannels(0xFF8888, 'Channel to be deleted', 'This battle\'s channels will be deleted in 30 seconds.')

    await delay(30 * 1000)

    await Battle.deleteChannels(this.id, this.game.guild)
  }

  async getShouldContinueBattle() {
    // The battle should continue if two characters from two different teams
    // are alive.

    const aliveTeams = await this.getAliveTeams()

    if (aliveTeams.length >= 2) {
      return true
    } else {
      return false
    }
  }

  async getAliveTeams() {
    const aliveTeams = []

    for (const team of this.teams) {
      for (const member of await this.game.teams.getMembers(team)) {
        if (await this.game.battleCharacters.isAlive(member)) {
          aliveTeams.push(team)
          break
        }
      }
    }

    return aliveTeams
  }

  async runCurrentTurn() {
    const name = await this.game.battleCharacters.getName(this.currentCharacterId)

    if (await this.game.battleCharacters.isDead(this.currentCharacterId)) {
      await this.writeToAllChannels(0x555555, `${name}'s turn`, `${name} is dead and cannot act.`)
      return
    }

    if (await this.game.battleCharacters.getCharacterType(this.currentCharacterId) === 'user') {
      const userId = await this.game.battleCharacters.getCharacterId(this.currentCharacterId)
      await this.writeToAllChannels(promptColor, `${name}'s turn`, `It's ${name}'s (<@${userId}>) turn.`)
    } else {
      await this.writeToAllChannels(promptColor, `${name}'s turn`, `It's ${name}'s turn.`)
    }

    await delay(400)
    await this.writeBattleStatus()
    await delay(400)

    const action = await this.getBattleCharacterAction(this.currentCharacterId, this.currentTeamId)

    if (action.type === 'use move') {
      await action.move.go(this.currentCharacterId, action.target, this)
    } else {
      await log.warn('Invalid action type:', action.type)
      await log.warn(`..acted by battle character ${this.currentCharacterId} (${name})`)
    }
  }

  async onNewRound() {
    await this.tickAllTemporaryEffects()
  }

  async writeMoveMessage(move, color, content) {
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#displayMoveMessage(BattleMove move) expected')
    if (!color || typeof color !== 'number') throw new TypeError('Battle#displayMoveMessage(, number color) expected')
    if (!content || typeof content !== 'string') throw new TypeError('Battle#displayMoveMessage(,, string content) expected')

    await this.writeToAllChannels(color, await this.getCurrentMoveTitle(move), content)
  }

  async getAllCharacters() {
    return (await Promise.all(this.teams.map(team => this.game.teams.getMembers(team)))).reduce((a, b) => a.concat(b), [])
  }

  async dealDamageToCharacter(move, targetId, damage) {
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#dealDamageToCharacter(BattleMove move) expected')
    if (!targetId || typeof targetId !== 'string') throw new TypeError('Battle#dealDamageToCharacter(string targetId) expected')
    if (typeof damage !== 'number') throw new TypeError('Battle#dealDamageToCharacter(, number damage) expected')

    const title = await this.getCurrentMoveTitle(move)
    const wasAlive = await this.game.battleCharacters.isAlive(targetId)
    await this.game.battleCharacters.dealDamage(targetId, damage)
    await this.writeToAllChannels(0xD79999, title, `Deals ${damage} damage.`)
    const isDead = await this.game.battleCharacters.isDead(targetId)
    if (wasAlive && isDead) {
      await delay(600)
      await this.writeToAllChannels(0xFF7777, title, `Defeated ${await this.game.battleCharacters.getName(targetId)}!`)
    }
  }

  async getCurrentMoveTitle(move) {
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#getCurrentMoveTitle(Move move) expected')

    return `${await this.game.battleCharacters.getName(this.currentCharacterId)} - ${move.name}`
  }

  async writeBattleStatus() {
    for (const team of this.teams) {
      let status = ''

      status += '**Your team:**\n'

      const _addMemberLine = async (member, fromThisTeam) => {
        const name = await this.game.battleCharacters.getName(member)
        if (await this.game.battleCharacters.isAlive(member)) {
          const curHP = await this.game.battleCharacters.getHP(member)
          const maxHP = await this.game.battleCharacters.getMaxHP(member)
          const hpTicks = Math.ceil((15 / maxHP) * curHP)
          const prettyHP = '█'.repeat(hpTicks) + '░'.repeat(15 - hpTicks)

          status += `**${name}:**`
          status += `\`{${prettyHP}}\``

          // Only display accurate HP values if this member is on the current
          // team.
          if (fromThisTeam) {
            status += `(${curHP} / ${maxHP})`
          }

          const tempEffects = Object.entries(this.temporaryEffects.get(member) || {})
            .filter(([ name, value ]) => value !== 0)

          if (tempEffects.length) {
            status += ' ('
            status += tempEffects.map(([ name, value ]) => `${name}: ${value > 0 ? '+' + value : value}`).join(', ')
            status += ')'
          }
        } else {
          status += `${name} (Dead)`
        }
        status += '\n'
      }

      for (const member of await this.game.teams.getMembers(team)) {
        await _addMemberLine(member, true)
      }

      status += '\n**Opposing teams:**\n'

      for (const opposingTeam of this.teams.filter(t => t !== team)) {
        status += `\n`
        for (const member of await this.game.teams.getMembers(opposingTeam)) {
          await _addMemberLine(member, false)
        }
      }

      await this.writeToTeamChannel(team, promptColor, 'Battle status', status)
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
      await this.onNewRound()
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
    } else if (characterType === 'ai') {
      // TODO: AI turn picking

      await delay(1000)

      const aiType = await this.game.battleCharacters.getCharacterId(battleCharacterId)

      if (this.game.enemies.has(aiType) === false) {
        await log.warn(`Invalid AI type: "${aiType}" (Skipping turn)`)
        await log.warn(`..on battle character ${battleCharacterId} (${await this.game.battleCharacters.getName(battleCharacterId)})`)
        return { type: 'use move', move: this.game.moves.get('skip-turn') }
      }

      const ai = this.game.enemies.get(aiType)

      return await ai.chooseAction(battleCharacterId, teamId, this)
    }
  }

  async getUserAction(battleCharacterId, teamId) {
    if (!battleCharacterId || typeof battleCharacterId !== 'string') throw new TypeError('Battle#getUserAction(string battleCharacterId) expected')
    if (!teamId || typeof teamId !== 'string') throw new TypeError('Battle#getUserAction(, string teamId) expected')

    // TODO: Implement tactics and items
    const userMoves = {
      skipTurn: [ 'Skip Turn', '⚓' ],
      // tactics: [ 'Tactics', '🏴' ],
      // items: [ 'Items',   '🌂' ],
      attacks: [ 'Attacks', '🥊' ]
    }

    // TEMP, user should be able to learn attacks and stuff
    // TODO: Move to attacks map stored on game
    const userAttacks = ['tackle', 'buff', 'sap']

    const userId = await this.game.battleCharacters.getCharacterId(battleCharacterId)
    const member = await this.game.users.getDiscordMember(userId)
    const channel = this.channelMap.get(teamId)

    switch ((await temporaryPrompt(channel, userId, `${member.displayName}'s Turn`, userMoves)).choice) {
      case 'attacks': {
        const choices = new Map(userAttacks.map(attackId => {
          const move = this.game.moves.get(attackId)
          return [move, [move.name, move.emoji]]
        }))
        const { choice: move } = await temporaryPrompt(channel, userId, `${member.displayName}'s Turn - Attacks`, choices)
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

    const allCharacters = await this.getAllCharacters()

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

    return (await temporaryPrompt(channel, userId, `${await this.game.users.getName(userId)}'s turn - use ${move.name} on who?`, choices)).choice
  }

  async writeToAllChannels(color, title, content) {
    const teamIds = Array.from(this.channelMap.keys())
    await Promise.all(teamIds.map(teamId => this.writeToTeamChannel(teamId, color, title, content)))
  }

  async writeToTeamChannel(teamId, color, title, content) {
    // Writes a text box to the given team's channel, if that channel exists,
    // and if there is at least one player-type character inside the channel.

    if (this.channelMap.has(teamId) === false) {
      await log.warn('Battle#writeToTeamChannel called with a team ID that isn\'t in the team map?')
      console.trace('Warning trace of writeToTeamChannel')
      return false
    }

    const members = await this.game.teams.getMembers(teamId)
    const types = await Promise.all(members.map(id => this.game.battleCharacters.getCharacterType(id)))
    if (types.some(type => type === 'user')) {
      const channel = this.channelMap.get(teamId)
      await richWrite(channel, color, title, content)
    }
  }

  static async deleteChannels(battleId, guild) {
    return await Promise.all(guild.channels
      .filter(channel => channel.name.startsWith('battle-' + battleId))
      .map(channel => channel.delete())
    )
  }

  // Battle formulas. Subject to tweaking and redefining!
  // These should probably mostly be moved to another class at some point.
  // (Handy so that if, for example, a user takes damage out of battle, that
  // damage can use the same formulas as damage in-battle.)

  async getBasicDamage(baseDamage, actorId, targetId) {
    const attack = await this.game.battleCharacters.getBaseAttack(actorId) + this.getTemporaryEffect(actorId, 'attackBuff')
    const defense = await this.game.battleCharacters.getBaseDefense(targetId) + this.getTemporaryEffect(targetId, 'defenseBuff')
    return Math.ceil(baseDamage * attack / defense)
  }

  getTemporaryEffect(characterId, effectName) {
    if (this.temporaryEffects.has(characterId) === false) {
      return 0
    }

    return this.temporaryEffects.get(characterId)[effectName] || 0
  }

  setTemporaryEffect(characterId, effectName, value) {
    if (this.temporaryEffects.has(characterId) === false) {
      this.temporaryEffects.set(characterId, {})
    }

    this.temporaryEffects.get(characterId)[effectName] = value
  }

  tickAllTemporaryEffects() {
    // Subtracts one from every temporary effect on every character, so that
    // the value is moved towards zero.

    for (const characterEffects of this.temporaryEffects.values()) {
      for (const effectName of Object.keys(characterEffects)) {
        characterEffects[effectName] -= Math.sign(characterEffects[effectName])
      }
    }
  }
}

module.exports = { Battle }
