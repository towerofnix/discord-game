const { log } = require('./util')
const chalk = require('chalk')
const shortid = require('shortid')

class Battle {
  constructor(teamA, teamB) {
    if (!teamA || !Array.isArray(teamA) || teamA.length == 0)
      throw new TypeError('new Battle(array<User> teamA) expected')
    if (!teamB || !Array.isArray(teamB) || teamB.length == 0)
      throw new TypeError('new Battle(, array<User> teamB) expected')

    this.id = shortid.generate()
    this.teamA = teamA
    this.teamB = teamB

    this.created = false
    this.channel = null
  }

  async create() {
    if (this.created) throw new Error('Battle#create() already created')
    this.created = true
    this.channel = await global.guild.createChannel(`battle-${id}`, 'text', [
      // TODO: permissions!
      //{ id: EVERYONE }
    ])

    // TODO
  }
}

module.exports = { Battle }
