const { log, temporaryPrompt, richWrite, delay } = require('./util')
const { env } = require('./env')
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
    this.originallyPlayingSongs = {} // Object userId -> song

    this.channelMap = new Map()
    this.started = false
    this.temporaryEffects = new Map() // Map of character ID -> {attack, defense, poison, ...} temporary effects

    this.currentTeamId = null
    this.currentCharacterId = null

    this.battleStatuses = []
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

    if (await env('music_enabled', 'boolean') === true) {
      for (const team of this.teams) {
        for (const character of await this.game.teams.getMembers(team)) {
          if (await this.game.battleCharacters.getCharacterType(character) === 'user') {
            let id = await this.game.battleCharacters.getCharacterId(character)
            this.originallyPlayingSongs[id] = await this.game.users.getListeningTo(id)
            await this.game.music.play('battle', id)
          }
        }
      }
    }

    // TODO spectator channel?
    // TODO header image

    this.currentTeamId = this.teams[0]
    this.currentCharacterId = (await this.game.teams.getMembers(this.currentTeamId))[0]

    this.battleStatuses = await this.writeBattleStatuses()

    await this.runBattleLoop()
  }

  async runBattleLoop() {
    while (await this.getShouldContinueBattle()) {
      await this.runCurrentTurn()
      this.nextBattleCharacter()
      await delay(800)
    }

    await this.updateBattleStatuses()
    const aliveTeams = await this.getAliveTeams()

    if (aliveTeams.length === 1) {
      const firstMember = (await this.game.teams.getMembers(aliveTeams[0]))[0]
      const name = await this.game.battleCharacters.getName(firstMember)
      await this.writeToAllChannels(0x4488EE, 'Battle results', `The team of ${name} won!`)
    } else if (aliveTeams.length === 0) {
      await this.writeToAllChannels(0x4488EE, 'Battle results', 'No teams survived.')
    }

    for (let [ id, song ] of Object.entries(this.originallyPlayingSongs)) {
      await this.game.music.play(song, id)
    }

    await delay(800)
    const msgs = await this.writeToAllChannels(0xFF8888, 'Channel to be deleted', 'This battle\'s channels will be deleted in 30 seconds.')

    for (let secs = 29; secs > 0; secs--) {
      let editPromises = []
      const embed = new discord.RichEmbed()
        .setTitle('Channel to be deleted')
        .setColor(0xFF8888)
        .setDescription(`This battle\'s channels will be deleted in ${secs} second${secs == 1 ? '' : 's'}.`)

      for (let msg of msgs) {
        editPromises.push(
          msg.edit('', embed))
      }

      await Promise.all([
        delay(1000),
        ...editPromises,
      ])
    }

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

    if (await this.getTemporaryEffect(this.currentCharacterId, 'silentIdle') > 0) {
      return
    }

    if (await this.game.battleCharacters.isDead(this.currentCharacterId)) {
      await this.writeToAllChannels(0x555555, `${name}'s turn`, `${name} is dead and cannot act.`)
      return
    }

    if (await this.getTemporaryEffect(this.currentCharacterId, 'idle') > 0) {
      await this.writeToAllChannels(0x555555, `${name}'s turn`, `${name} is idled and does not act.`)
      return
    }

    if (await this.game.battleCharacters.getCharacterType(this.currentCharacterId) === 'user') {
      const userId = await this.game.battleCharacters.getCharacterId(this.currentCharacterId)
      const { displayColor } = await this.game.users.getDiscordMember(userId)

      await this.writeToAllChannels(displayColor, `${name}'s turn`, `It's <@${userId}>'s turn.`)
    } else {
      await this.writeToAllChannels(promptColor, `${name}'s turn`, `It's ${name}'s turn.`)
    }

    await this.updateBattleStatuses()

    /*
    await delay(400)
    await this.writeBattleStatuses()
    await delay(400)
    */

    const action = await this.getBattleCharacterAction(this.currentCharacterId, this.currentTeamId)

    if (action.type === 'use move') {
      const moveId = action.move
      if (this.game.moves.has(moveId)) {
        await (this.game.moves.get(moveId)).go(this.currentCharacterId, this.currentTeamId, action.target, this)
      } else {
        await log.warn(`Invalid action move ID: ${moveId}`)
        await log.warn(`..acted by battle character ${this.currentCharacterId} (${name})`)
      }
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
    if (!color) throw new TypeError('Battle#displayMoveMessage(, ColorResolvable color) expected')
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
    await this.writeToAllChannels('RED', title, `Deals ${damage} damage.`)
    const isDead = await this.game.battleCharacters.isDead(targetId)
    if (wasAlive && isDead) {
      await delay(600)
      await this.writeToAllChannels('DARK_RED', title, `Defeated ${await this.game.battleCharacters.getName(targetId)}!`)
    }
  }

  async getCurrentMoveTitle(move) {
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#getCurrentMoveTitle(Move move) expected')

    return `${await this.game.battleCharacters.getName(this.currentCharacterId)} - ${move.name}`
  }

  async getBattleStatusForTeam(team) {
    if (!team) throw new TypeError('Battle#getBattleStatusForTeam(Team team) expected')

    let status = '**Your team:**\n'

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
        status += `~~${name}~~ (Dead)`
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

    return status
  }

  async writeBattleStatuses() {
    let battleStatuses = []

    for (const team of this.teams) {
      const status = await this.getBattleStatusForTeam(team)
      const msg = await this.writeToTeamChannel(team, 'DEFAULT', 'Battle status', status)

      if (msg) {
        await msg.pin()
        battleStatuses.push([ msg, team ])
      }
    }

    return battleStatuses
  }

  async updateBattleStatuses() {
    for (const [ msg, team ] of this.battleStatuses) {
      const status = await this.getBattleStatusForTeam(team)
      const embed = new discord.RichEmbed()
        .setTitle('Battle status')
        .setColor('DEFAULT')
        .setDescription(status)

      await msg.edit('', embed)
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

      if (this.game.battleAIs.has(aiType) === false) {
        await log.warn(`Invalid AI type: "${aiType}" (Skipping turn)`)
        await log.warn(`..on battle character ${battleCharacterId} (${await this.game.battleCharacters.getName(battleCharacterId)})`)
        return { type: 'use move', move: this.game.moves.get('skip-turn') }
      }

      const ai = this.game.battleAIs.get(aiType)

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

    switch ((await temporaryPrompt(channel, userId, `${member.displayName}'s Turn`, userMoves, member.displayColor)).choice) {
      case 'attacks': {
        const choices = new Map(userAttacks.map(attackId => {
          const { id, name, emoji } = this.game.moves.get(attackId)
          return [id, [name, emoji]]
        }))
        const { choice: move } = await temporaryPrompt(channel, userId, `${member.displayName}'s Turn - Attacks`, choices, member.displayColor)
        const target = await this.getUserTarget(userId, teamId, move)
        return { type: 'use move', move, target }
      }

      // case 'items': {}
      // case 'tactics': {}

      case 'skipTurn':
      default: {
        return { type: 'use move', move: 'skip-turn' }
      }
    }
  }

  async getUserTarget(userId, teamId, moveId) {
    // TODO: Multi-page prompt function. We can use :heart:s for five options
    // per page, but when there's more than five possible choices, that won't
    // work.

    if (!userId || typeof userId !== 'string') throw new TypeError('Battle#getUserTarget(string userId) expected')
    if (!teamId || typeof teamId !== 'string') throw new TypeError('Battle#getUserTarget(, string teamId) expected')
    if (!moveId || typeof moveId !== 'string') throw new TypeError('Battle#getUserTarget(,, string moveId) expected')

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

    const { name: moveName } = await this.game.moves.get(moveId)

    return (await temporaryPrompt(channel, userId, `${await this.game.users.getName(userId)}'s turn - use ${moveName} on who?`, choices, await this.game.users.getDiscordMember(userId).then(m => m.displayColor))).choice
  }

  async writeToAllChannels(color, title, content) {
    const teamIds = Array.from(this.channelMap.keys())
    const msgs = await Promise.all(
      teamIds.map(teamId => this.writeToTeamChannel(teamId, color, title, content)))

    return msgs.filter(msg => !!msg) // remove falsey values
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
      return await richWrite(channel, color, title, content)
    }

    return null
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
