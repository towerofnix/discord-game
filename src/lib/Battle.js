import { warn } from './util/log'
import richWrite from './util/richWrite'
import showMenu from './util/showMenu'
import delay from './util/delay'
import env from './util/env'
import asyncFilter from './util/asyncFilter'
import BattleMove from './BattleMove'

const chalk = require('chalk')
const shortid = require('shortid')
const discord = require('discord.js')

export default class Battle {
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
            await this.game.users.setListeningTo(id, 'battle')
          }
        }
      }
    }

    // TODO spectator channel?
    // TODO header image

    this.currentTeamId = this.teams[0]
    this.currentCharacterId = (await this.game.teams.getMembers(this.currentTeamId))[0]

    this.battleStatuses = await this.writeBattleStatuses(true)

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
      await this.game.users.setListeningTo(id, song)
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

    if (await this.getTemporaryEffect(this.currentCharacterId, 'rest') > 0) {
      await this.writeToAllChannels(0x555555, `${name}'s turn`, `${name} is resting and cannot act.`)
      return
    }

    if (await this.game.battleCharacters.getCharacterType(this.currentCharacterId) === 'user') {
      const userId = await this.game.battleCharacters.getCharacterId(this.currentCharacterId)
      const { displayColor } = await this.game.users.getDiscordMember(userId)

      await this.writeToAllChannels(displayColor, `${name}'s turn`, `It's <@${userId}>'s turn.`)
    } else {
      await this.writeToAllChannels(0x00AE86, `${name}'s turn`, `It's ${name}'s turn.`)
    }

    await this.updateBattleStatuses()
    await delay(400)
    await this.writeBattleStatuses()
    await delay(400)

    const action = await this.getBattleCharacterAction(this.currentCharacterId, this.currentTeamId)

    if (action.type === 'use move') {
      const moveId = action.move
      if (this.game.moves.has(moveId)) {
        await (this.game.moves.get(moveId)).go(this.currentCharacterId, this.currentTeamId, action.target, this)
      } else {
        await warn(`Invalid action move ID: ${moveId}`)
        await warn(`..acted by battle character ${this.currentCharacterId} (${name})`)
      }
    } else {
      await warn(
        `Invalid action type: "${action.type}" acted by battle character ${this.currentCharacterId} (${name})`
      )
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

  async getAllCharactersFilter(filter) {
    // TODO: Re-implement with or discard in favor of asyncFilter
    if (!filter || typeof filter !== 'function') throw new TypeError('Battle#getAllCharactersFilter(function filter) expected')

    let all = (await Promise.all(this.teams.map(team => this.game.teams.getMembers(team)))).reduce((a, b) => a.concat(b), [])
    let filtered = []

    for (let id of all) {
      let ok = await filter(id, this.game)
      if (ok) filtered.push(id)
    }

    return filtered
  }

  async getAllTeamsFilter(filter) {
    if (!filter || typeof filter !== 'function') throw new TypeError('Battle#getAllTeamsFilter(function filter) expected')

    return await asyncFilter(t => filter(t, this.game))(this.teams)
  }

  async getAllAliveCharacters() {
    return this.getAllCharactersFilter(async id => {
      return await this.game.battleCharacters.isAlive(id)
    })
  }

  async dealDamageToCharacter(move, targetId, damage) {
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#dealDamageToCharacter(BattleMove move) expected')
    if (!targetId || typeof targetId !== 'string') throw new TypeError('Battle#dealDamageToCharacter(string targetId) expected')
    if (typeof damage !== 'number') throw new TypeError('Battle#dealDamageToCharacter(, number damage) expected')

    const title = await this.getCurrentMoveTitle(move)
    const wasAlive = await this.game.battleCharacters.isAlive(targetId)
    await this.game.battleCharacters.dealDamage(targetId, damage)
    await this.writeToAllChannels('RED', title, `Deals ${damage} damage to ${await this.game.battleCharacters.getName(targetId)}.`)
    const isDead = await this.game.battleCharacters.isDead(targetId)
    if (wasAlive && isDead) {
      await delay(600)
      await this.writeToAllChannels('DARK_RED', title, `Defeated ${await this.game.battleCharacters.getName(targetId)}!`)
    }
  }

  async healCharacter(move, targetId, amount) {
    if (!move || move instanceof BattleMove === false) throw new TypeError('Battle#healCharacter(BattleMove move) expected')
    if (!targetId || typeof targetId !== 'string') throw new TypeError('Battle#healCharacter(string targetId) expected')
    if (!amount || typeof amount !== 'number') throw new TypeError('Battle#healCharacter(, number amount) expected')

    const title = await this.getCurrentMoveTitle(move)
    await this.game.battleCharacters.heal(targetId, amount)
    await // FIXME ???
    await this.writeToAllChannels(0xD96FCA, title, `Heals ${await this.game.battleCharacters.getName(targetId)} for ${amount} HP.`)
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

        const tempEffects = (this.temporaryEffects.get(member) || [])
          .filter(({ value }) => value !== 0)
          .filter(({ silent }) => silent !== true)

        if (tempEffects.length) {
          status += ' ('
          status += tempEffects.map(({ name, value, getDisplayString }) => {
            if (getDisplayString) {
              const str = getDisplayString(value)

              if (str.length > 0) {
                return `${name}: ${str}`
              } else {
                return name
              }
            } else {
              return `${name}: ${value > 0 ? '+' + value : value}`
            }
          }).join(', ')
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


  async getShortBattleStatusForTeam(team) {
    if (!team) throw new TypeError('Battle#getShortBattleStatusForTeam(Team team) expected')

    let status = ''

    const _addMemberLine = async (member, fromThisTeam) => {
      const name = await this.game.battleCharacters.getName(member)
      if (await this.game.battleCharacters.isAlive(member)) {
        const curHP = await this.game.battleCharacters.getHP(member)
        const maxHP = await this.game.battleCharacters.getMaxHP(member)

        status += `**${name}**`

        // Only display accurate HP values if this member is on the current
        // team.
        if (fromThisTeam) status += ` ${curHP}/${maxHP}`
      } else {
        status += `~~${name}~~`
      }
      status += ' '
    }

    for (const member of await this.game.teams.getMembers(team)) {
      await _addMemberLine(member, true)
    }

    for (const opposingTeam of this.teams.filter(t => t !== team)) {
      status += '~ '
      for (const member of await this.game.teams.getMembers(opposingTeam)) {
        await _addMemberLine(member, false)
      }
    }

    return status
  }

  async writeBattleStatuses(pin = false) {
    let battleStatuses = []

    for (const team of this.teams) {
      const status = await this.getBattleStatusForTeam(team)
      const msg = await this.writeToTeamChannel(team, 'DEFAULT', 'Battle status', status)

      if (pin && msg) {
        await msg.pin()
        battleStatuses.push([ msg, team ])
      }
    }

    return battleStatuses
  }

  async updateBattleStatuses() {
    for (const [ msg, team ] of this.battleStatuses) {
      const status = await this.getBattleStatusForTeam(team)
      const statusShort = await this.getShortBattleStatusForTeam(team)
      const embed = new discord.RichEmbed()
        .setTitle('Battle status')
        .setColor('DEFAULT')
        .setDescription(status)

      await msg.edit('', embed)
      await this.channelMap.get(team).setTopic(statusShort)
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
      await delay(1000)

      const aiType = await this.game.battleCharacters.getCharacterId(battleCharacterId)

      if (this.game.battleAIs.has(aiType) === false) {
        await warn(`Invalid AI type: "${aiType}" (Skipping turn)`)
        await warn(`..on battle character ${battleCharacterId} (${await this.game.battleCharacters.getName(battleCharacterId)})`)
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
    const userAttacks = ['tackle', 'buff', 'kabuff', 'sap', 'revive']

    const userId = await this.game.battleCharacters.getCharacterId(battleCharacterId)
    const member = await this.game.users.getDiscordMember(userId)
    const channel = this.channelMap.get(teamId)

    const actorName = await this.game.battleCharacters.getName(battleCharacterId)
    const turnTitle = `${actorName}'s Turn`

    const userAction = {}

    await showMenu(channel, userId, {
      start: 'choose action',
      showBack: true,
      dialogs: {
        'choose action': {
          title: turnTitle,
          options: [
            {title: 'Skip Turn', emoji: '⚓', action: () => {
              userAction.type = 'use move'
              userAction.move = 'skip-turn'
            }},
            {title: 'Attacks', emoji: '🥊', action: {to: 'pick attack'}}
          ]
        },
        'pick attack': {
          action: () => {
            userAction.type = 'use move'
            delete userAction.move
          },
          title: turnTitle + ' - Attacks',
          options: async () => {
            const options = []

            for (const id of userAttacks) {
              const move = this.game.moves.get(id)
              const targets = await this.getMoveTargets(move)

              if (targets.length > 0) {
                options.push({title: move.name, emoji: move.emoji, action: () => {
                  userAction.move = move.id
                  return {to: 'pick target'}
                }})
              }
            }

            return options
          }
        },
        'pick target': {
          action: () => {
            delete userAction.target
          },
          title: () => {
            const move = this.game.moves.get(userAction.move)
            if (move.targetType === 'character') {
              return `${turnTitle} - Use ${move.name} on who?`
            } else if (move.targetType === 'team') {
              return `${turnTitle} - Use ${move.name} on which team?`
            }
          },
          autopageOptions: async () => {
            return await this.getMoveTargets(this.game.moves.get(userAction.move), id => {
              userAction.target = id
            })
          }
        }
      }
    })

    return userAction
  }

  async getMoveTargets(move, actionCallback = id => {}) {
    if (move.targetType === 'character') {
      const characterIds = await this.getAllCharactersFilter(move.targetFilter)

      return await Promise.all(characterIds.map(
        async id => ({title: await this.game.battleCharacters.getName(id), action: () => {
          return actionCallback(id)
        }})
      ))
    } else if (move.targetType === 'team') {
      const teamIds = await this.getAllTeamsFilter(move.targetFilter)

      return await Promise.all(teamIds.map(
        async id => ({title: 'Team BLOOORGH!!! NAMES ARE NOT IMPLEMENTED YET!!!!!!!', action: () => {
          return actionCallback(id)
        }})
      ))
    } else {
      return []
    }
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
      await warn('Battle#writeToTeamChannel called with a team ID that isn\'t in the team map?')
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
    if (this.getTemporaryEffect(targetId, 'invincible-against-normal') > 0) {
      return 0
    }

    const attack = await this.game.battleCharacters.getBaseAttack(actorId) + this.getTemporaryEffect(actorId, 'attack-buff')
    const defense = await this.game.battleCharacters.getBaseDefense(targetId) + this.getTemporaryEffect(targetId, 'defense-buff')
    return Math.ceil(baseDamage * attack / defense)
  }

  getTemporaryEffect(characterId, effectType) {
    if (this.temporaryEffects.has(characterId) === false) {
      return 0
    }

    return this.temporaryEffects.get(characterId)
      .reduce((val, item) => item.type === effectType ? Math.max(item.value, val) : val, 0)
  }

  addTemporaryEffect(characterId, effect) {
    if (this.temporaryEffects.has(characterId) === false) {
      this.temporaryEffects.set(characterId, [])
    }

    this.temporaryEffects.get(characterId).push(effect)
  }

  tickAllTemporaryEffects() {
    // Subtracts one from every temporary effect on every character, so that
    // the value is moved towards zero.

    for (const characterEffects of this.temporaryEffects.values()) {
      for (const effect of characterEffects) {
        effect.value -= Math.sign(effect.value)
      }
    }
  }
}
