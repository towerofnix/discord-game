const { log, prompt } = require('./util')
const { User } = require('./User')
const attacks = require('../game/moves/attacks')

const chalk = require('chalk')
const shortid = require('shortid')

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

  async start(guild) {
    if (!guild) throw new TypeError('Battle#start(discord.Guild guild) expected')
    if (this.started) throw new Error('Battle#start() already started')
    this.started = true

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
      if (entity instanceof User)
        await (await entity.getMember(guild)).addRole(this.teamARole)
    }

    for (let entity of this.teamB) {
      if (entity instanceof User)
        await (await entity.getMember(guild)).addRole(this.teamARole)
    }

    return await this.teamATurn(guild)
  }

  async teamATurn(guild) {
    if (!guild) throw new TypeError('Battle#teamATurn(discord.Guild guild) expected')

    for (let entity of this.teamA) {
      if (entity instanceof User) {
        let user = entity
        let member = await user.getMember(guild)

        let userMoves = [
          [ 'Tactics', '🏴' ],
          [ 'Items',   '🌂' ],
          [ 'Attacks', '🥊' ],
        ]

        let userAttacks = [
          // TEMP, user should be able to learn attacks and stuff
          new attacks.Tackle
        ]

        switch (await prompt(this.teamAChannel, user, `${member.displayName}'s Turn`, userMoves)) {
          case '🥊': {
            let attack = await prompt(this.teamAChannel, user, `${member.displayName}'s Turn - Attacks`, userAttacks.map(atk => [ atk.name, atk.emoji ]))
            // TODO
            break
          }

          case '🏴':
          case '🌂': {
            // TODO
            throw new TypeError
          }
        }
      } else if (entity instanceof Enemy) {
        // TODO
      } else throw new TypeError
    }
  }
}

module.exports = { Battle }
