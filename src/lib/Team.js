const discord = require('discord.js')
const shortid = require('shortid')

// Aaagh node module hacks.
const _BattleCharacter = () => require('./BattleCharacter').BattleCharacter
const _User = () => require('./User').User

class Team {
  // A Team is a collection of BattleCharacters who work together in
  // (but not exclusively in) combat.

  constructor() {
    this.battleCharacters = []

    // TODO: This should be serialized, somehow!
    this.id = shortid.generate().toLowerCase()
  }

  [Symbol.iterator]() {
    return this.battleCharacters[Symbol.iterator]()
  }

  async addBattleCharacter(battleCharacter) {
    // I'm so sorry for these lines of code.
    const BattleCharacter = _BattleCharacter()
    if (!battleCharacter || battleCharacter instanceof BattleCharacter === false) throw new TypeError('Team#addBattleCharacter(BattleCharacter battleCharacter) expected')

    this.battleCharacters.push(battleCharacter)
  }

  getRoleName() {
    return `in team: ${this.id}`
  }

  async getRole(guild) {
    if (!guild || guild instanceof discord.Guild === false) throw new TypeError('Team#getRole(discord.Guild guild) expected')

    const roleName = this.getRoleName()

    let role = guild.roles.find(role => role.name === roleName)

    if (role === null) {
      role = await guild.createRole({ name: roleName })
    }

    // Now that we're getting the role, we can use this a as a chance to add
    // users to it.
    await this.addUsersToRole(role, guild)

    return role
  }

  async addUsersToRole(role, guild) {
    if (!role || role instanceof discord.Role === false) throw new TypeError('Team#addUsersToRole(discord.Role role) expected')
    if (!guild || guild instanceof discord.Guild === false) throw new TypeError('Team#addUsersToRole(discord.Guild guild) expected')

    for (let { entity } of this) {
      if (entity instanceof _User()) {
        const member = await entity.getMember(guild)
        member.addRole(role)
      }
    }
  }
}

module.exports = { Team }
