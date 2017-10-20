// @flow

import { warn } from './util/log'
import { maybe } from './util/checkTypes'
import richWrite from './util/richWrite'
import showMenu from './util/showMenu'
import delay from './util/delay'
import env from './util/env'
import asyncFilter from './util/asyncFilter'
import BattleMove from './BattleMove'
import Game from './Game'
import Effect from './Effect'

const shortid = require('shortid')
const discord = require('discord.js')

type Color = number | string
type Pvoid = Promise<void>

export const EffectData = {
  name: String,
  type: String,
  value: Number,
  minValue: Number,
  maxValue: Number,
  getDisplayString: maybe(Function),
  decaySpeed: maybe(Number),
  etc: maybe(Object),
}

export default class Battle {
  // A reference to the Game object.
  game: Game

  // A unique identifier for the battle. This is used in channel names and
  // other places where two (or more) battles have to be kept track of, but
  // references to the battle objects themselves can't be kept.
  id: string

  // The array of teams in this battle. Usually this is two, but it can be
  // greater.
  teams: Array<string>

  // A big, bad thing created by Alex!! This should be handled in the music
  // controller (TODO something like pushing, rather than setting, music would be
  // good maybe - such as window.location.history)
  originallyPlayingSongs: Map<string, string>

  // A mapping of team IDs to their text channels from the game's Discord
  // guild.
  channelMap: Map<string, discord.TextChannel>

  // The current team and character identifiers. These are actual team and
  // battle character IDs.
  currentTeamId: string
  currentCharacterId: string

  // Mapping of battle character IDs to arrays of effects.
  temporaryEffects: Map<string, Array<Effect>>

  // An array of "team status" messages, to be continually edited throughout
  // the battle.
  battleStatuses: Array<discord.Message>

  // Whether or not the battle has been started yet. Set to true when #go is
  // called.
  started: boolean

  constructor(game: Game, teams: Array<string>) {
    if (teams.length < 2) throw new TypeError('At least two teams expected')

    this.game = game
    this.id = shortid.generate().toLowerCase()
    this.teams = teams
    this.originallyPlayingSongs = new Map()

    this.channelMap = new Map()
    this.started = false
    this.temporaryEffects = new Map()

    this.battleStatuses = []
  }

  async start(): Pvoid {
    if (this.started) throw new Error('Battle#start() already started')
    this.started = true

    const everyoneRole = this.game.guild.id

    for (const teamId of this.teams) {
      const teamRole = await this.game.teams.getRole(teamId)

      this.channelMap.set(teamId, await this.game.guild.createChannel(`battle-${this.id}-team-${teamId}`, 'text', [
        { id: everyoneRole, deny: 3136, allow: 0 }, // @everyone -rw -react
        { id: teamRole.id, deny: 0, allow: 3072 }, // Team +rw
      ]))
    }

    if (await env('music_enabled', 'boolean') === true) {
      for (const team of this.teams) {
        for (const character of await this.game.teams.getMembers(team)) {
          if (await this.game.battleCharacters.getCharacterType(character) === 'user') {
            const id = await this.game.battleCharacters.getCharacterId(character)
            this.originallyPlayingSongs.set(id, await this.game.users.getListeningTo(id))
            await this.game.users.setListeningTo(id, 'battle')
          }
        }
      }
    }

    // TODO spectator channel?
    // TODO header image

    this.currentTeamId = this.teams[0]
    this.currentCharacterId = (await this.game.teams.getMembers(this.currentTeamId))[0]

    await this.writeBattleStatuses(true)

    await this.runBattleLoop()
  }

  async runBattleLoop(): Pvoid {
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

    for (const [ id, song ] of this.originallyPlayingSongs.entries()) {
      await this.game.users.setListeningTo(id, song)
    }

    await delay(800)
    const msgs = await this.writeToAllChannels(0xFF8888, 'Channel to be deleted', 'This battle\'s channels will be deleted in 30 seconds.')

    for (let secs = 29; secs > 0; secs--) {
      const embed = new discord.RichEmbed()
        .setTitle('Channel to be deleted')
        .setColor(0xFF8888)
        .setDescription(`This battle's channels will be deleted in ${secs} second${secs == 1 ? '' : 's'}.`)

      await Promise.all([
        delay(1000),
        msgs.map(msg => msg.edit('', embed))
      ])
    }

    await Battle.deleteChannels(this.id, this.game.guild)
  }

  async getShouldContinueBattle(): Promise<boolean> {
    // The battle should continue if two characters from two different teams
    // are alive.

    const aliveTeams = await this.getAliveTeams()

    if (aliveTeams.length >= 2) {
      return true
    } else {
      return false
    }
  }

  async getAliveTeams(): Promise<Array<string>> {
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

  async runCurrentTurn(): Pvoid {
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

  async onNewRound(): Pvoid {
    await this.tickAllTemporaryEffects()
  }

  async writeMoveMessage(move: BattleMove, color: Color, content: string): Pvoid {
    await this.writeToAllChannels(color, await this.getCurrentMoveTitle(move), content)
  }

  async getAllCharacters(): Promise<Array<string>> {
    return (await Promise.all(this.teams.map(team => this.game.teams.getMembers(team)))).reduce((a, b) => a.concat(b), [])
  }

  async getAllTeamsFilter(filter: (teamId: string, game: Game) => boolean): Promise<Array<string>> {
    return await asyncFilter(t => filter(t, this.game))(this.teams)
  }

  async getAllAliveCharacters(): Promise<Array<string>> {
    return await this.getAllCharacters().then(asyncFilter(id => this.game.battleCharacters.isAlive(id)))
  }

  async dealDamageToCharacter(move: BattleMove, targetId: string, damage: number): Pvoid {
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

  async healCharacter(move: BattleMove, targetId: string, amount: number): Pvoid {
    const title = await this.getCurrentMoveTitle(move)
    await this.game.battleCharacters.heal(targetId, amount)
    await this.writeToAllChannels(0xD96FCA, title, `Heals ${await this.game.battleCharacters.getName(targetId)} for ${amount} HP.`)
  }

  async getCurrentMoveTitle(move: BattleMove): Promise<string> {
    return `${await this.game.battleCharacters.getName(this.currentCharacterId)} - ${move.name}`
  }

  async getBattleStatusForTeam(team: string): Promise<string> {
    let status = '**Your team:**\n'

    const _addMemberLine = async (member: string, fromThisTeam: boolean): Pvoid => {
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
          status += tempEffects.map(({ name, value, getDisplayString }: Effect): string => {
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

  async getShortBattleStatusForTeam(team: string): Promise<string> {
    let status = ''

    const _addMemberLine = async (member: string, fromThisTeam: boolean): Pvoid => {
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

  async writeBattleStatuses(pin: boolean = false): Pvoid {
    this.battleStatuses = []

    for (const team of this.teams) {
      const status = await this.getBattleStatusForTeam(team)
      const msg = await this.writeToTeamChannel(team, 'DEFAULT', 'Battle status', status)

      if (pin && msg) {
        await msg.pin()
        this.battleStatuses.push([ msg, team ])
      }
    }
  }

  async updateBattleStatuses(): Pvoid {
    for (const [ msg, team ] of this.battleStatuses) {
      const status = await this.getBattleStatusForTeam(team)
      const statusShort = await this.getShortBattleStatusForTeam(team)
      const embed = new discord.RichEmbed()
        .setTitle('Battle status')
        .setColor('DEFAULT')
        .setDescription(status)

      // TODO: It looks like this isn't working...?
      await msg.edit('', embed)

      const channel = await this.channelMap.get(team)
      if (channel) {
        await channel.setTopic(statusShort)
      }
    }
  }

  async nextBattleCharacter(): Pvoid {
    const currentTeamMembers = await this.game.teams.getMembers(this.currentTeamId)
    const index = currentTeamMembers.indexOf(this.currentCharacterId)

    if (index + 1 >= currentTeamMembers.length) {
      await this.nextTeam()
    } else {
      this.currentCharacterId = currentTeamMembers[index + 1]
    }
  }

  async nextTeam(): Pvoid {
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

  async getBattleCharacterAction(battleCharacterId: string, teamId: string): Object {
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

  // TODO: Return an Action (probably a type, not a class), not an Object
  async getUserAction(battleCharacterId: string, teamId: string): Object {
    // TODO: Implement tactics and items
    // TEMP, user should be able to learn attacks and stuff
    // TODO: Move to attacks map stored on game
    const userAttacks = [ 'tackle', 'buff', 'kabuff', 'blunt', 'revive' ]

    const userId = await this.game.battleCharacters.getCharacterId(battleCharacterId)
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
            { title: 'Skip Turn', emoji: '⚓', action: () => {
              userAction.type = 'use move'
              userAction.move = 'skip-turn'
            } },
            { title: 'Defend', emoji: '🛡', action: () => {
              userAction.type = 'use move'
              userAction.move = 'defend'
            } },
            { title: 'Attacks', emoji: '🥊', action: { to: 'pick attack' } }
          ]
        },
        'pick attack': {
          action: () => {
            userAction.type = 'use move'
            delete userAction.move
          },
          title: turnTitle + ' - Attacks',
          options: async (): Promise<Array<Object>> => {
            const options = []

            for (const id of userAttacks) {
              const move = this.game.moves.get(id)
              const targets = await this.getMoveTargets(move)

              if (targets.length > 0) {
                options.push({ title: move.name, emoji: move.emoji, action: (): Object => {
                  userAction.move = move.id
                  return { to: 'pick target' }
                } })
              }
            }

            return options
          }
        },
        'pick target': {
          action: () => {
            delete userAction.target
          },
          title: (): string => {
            const move = this.game.moves.get(userAction.move)
            if (move.targetType === 'team') {
              return `${turnTitle} - Use ${move.name} on which team?`
            } else {
              return `${turnTitle} - Use ${move.name} on who?`
            }
          },
          autopageOptions: async () => await this.getMoveTargets(this.game.moves.get(userAction.move), (id: string) => {
            userAction.target = id
          })
        }
      }
    })

    return userAction
  }

  async getMoveTargets(move: BattleMove, actionCallback: (id: string) => ?Object = id => null): Promise<Array<Object>> {
    if (move.targetType === 'character') {
      const characterIds = await this.getAllCharacters().then(asyncFilter(id => move.targetFilter(id, this.game)))

      return await Promise.all(characterIds.map(
        async id => ({ title: await this.game.battleCharacters.getName(id), action: () => actionCallback(id) })
      ))
    } else if (move.targetType === 'team') {
      const teamIds = await this.getAllTeamsFilter(move.targetFilter)

      return await Promise.all(teamIds.map(
        async id => ({ title: 'Team BLOOORGH!!! NAMES ARE NOT IMPLEMENTED YET!!!!!!!', action: () => actionCallback(id) })
      ))
    } else {
      return []
    }
  }

  async writeToAllChannels(color: Color, title: string, content: string): Promise<Array<discord.Message>> {
    const teamIds = Array.from(this.channelMap.keys())
    const msgs = await Promise.all(
      teamIds.map(teamId => this.writeToTeamChannel(teamId, color, title, content)))

    return msgs.filter(msg => !!msg) // Remove falsey values
  }

  async writeToTeamChannel(teamId: string, color: Color, title: string, content: string): Pvoid {
    // Writes a text box to the given team's channel, if that channel exists,
    // and if there is at least one player-type character inside the channel.

    if (this.channelMap.has(teamId) === false) {
      await warn('Battle#writeToTeamChannel called with a team ID that isn\'t in the team map?')
      console.trace('Warning trace of writeToTeamChannel') // eslint-disable-line no-console
      return
    }

    const members = await this.game.teams.getMembers(teamId)
    const types = await Promise.all(members.map(id => this.game.battleCharacters.getCharacterType(id)))
    if (types.some(type => type === 'user')) {
      const channel = this.channelMap.get(teamId)
      return await richWrite(channel, color, title, content)
    }
  }

  static async deleteChannels(battleId: string, guild: discord.Guild): Pvoid {
    await Promise.all(guild.channels
      .filter(channel => channel.name.startsWith('battle-' + battleId))
      .map(channel => channel.delete())
    )
  }

  // Battle formulas. Subject to tweaking and redefining!
  // These should probably mostly be moved to another class at some point.
  // (Handy so that if, for example, a user takes damage out of battle, that
  // damage can use the same formulas as damage in-battle.)

  async getDefendingMultiplier(characterId: string): Promise<number> {
    const defending = this.getTemporaryEffect(characterId, 'defend')

    if (defending > 0) {
      return 0.5
    } else {
      return 1.0
    }
  }

  async getActiveAttack(characterId: string): Promise<number> {
    return await this.game.battleCharacters.getBaseAttack(characterId) + this.getTemporaryEffect(characterId, 'attack-buff')
  }

  async getActiveDefense(characterId: string): Promise<number> {
    return await this.game.battleCharacters.getBaseDefense(characterId) + this.getTemporaryEffect(characterId, 'defense-buff')
  }

  async getBasicDamage(baseDamage: number, actorId: string, targetId: string): Promise<number> {
    // Basic physical damage - this takes into account the attack and defense
    // stats of the actor and target, and considers whether or not the target
    // is defending.

    if (this.getTemporaryEffect(targetId, 'invincible-against-normal') > 0) {
      return 0
    }

    let val = baseDamage

    val *= await this.getActiveAttack(actorId)
    val /= await this.getActiveDefense(targetId)
    val *= await this.getDefendingMultiplier(targetId)

    return Math.ceil(val)
  }

  async getEnvironmentalDamage(baseDamage: number, targetId: string): Promise<number> {
    // "Environmental" damage - this doesn't take into account the attack stat
    // of the actor or the defense stat of the target, but does consider whether
    // or not the target is defending.
    //
    // This function doesn't do anything asynchronously, but is marked async to
    // be consistent with other "get damage" functions.

    let val = baseDamage

    val *= await this.getDefendingMultiplier(targetId)

    return Math.ceil(val)
  }

  async getElementalDamage(baseDamage: number, element: string, actorId: string, targetId: string): Promise<number> {
    // Elemental damage - in the future, may tweak damage dealt based on
    // specific resistances of the target. For now it behaves the same way
    // as environmental damage.

    return await this.getEnvironmentalDamage(baseDamage, targetId)
  }

  getTemporaryEffect(characterId: string, effectType: string): number {
    const effects = this.temporaryEffects.get(characterId)

    if (effects) {
      return effects.reduce((val, item) => item.type === effectType ? Math.max(item.value, val) : val, 0)
    } else {
      return 0
    }
  }

  addTemporaryEffect(characterId: string, effect: Effect): number {
    effect.constrainValue()

    this.getTemporaryEffects(characterId).push(effect)

    return effect.value
  }

  getTemporaryEffects(characterId: string): Array<Effect> {
    let effects = this.temporaryEffects.get(characterId)

    if (effects) {
      return effects
    }

    effects = []
    this.temporaryEffects.set(characterId, effects)
    return effects
  }

  boostTemporaryEffect(characterId: string, EffectClass: Class<Effect>, value: number): number {
    const effect = this.getTemporaryEffects(characterId)
      .find(f => f.constructor === EffectClass)

    if (effect) {
      effect.value += value
      effect.constrainValue()
      return effect.value
    } else {
      // If the effect doesn't already exist, create it.
      const effect = new EffectClass()
      effect.value = value
      effect.constrainValue()
      this.addTemporaryEffect(characterId, effect)
      return value
    }
  }

  tickAllTemporaryEffects() {
    // Calls the tick() method of every temporary effect on every character.
    // By default, tick() subtracts one so that the value moves towards zero.

    for (const characterEffects of this.temporaryEffects.values()) {
      for (const effect of characterEffects) {
        effect.tick()
      }
    }
  }
}
