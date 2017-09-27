// TODO: Figure out how to make this storeable in the database.
// You do this, Alex, since you set up the database and have more experience
// than me! -Florrie

const { Team } = require('./Team')

class BattleCharacter {
  // BattleCharacter stores data common between Players and Enemies. This is
  // mostly, but not only, battle-related information.
  //
  // Every Player and Enemy has a single BattleCharacter. This BattleCharacter
  // is NOT discarded when any given battle ends; rather, it's reused across
  // any and all battles the Player or Enemy takes part in.
  //
  // A given BattleCharacter may have more than one team.

  constructor(entity, teams = null) {
    if (!entity) throw new TypeError('new Entity(Enemy|Player entity) expected')
    if (teams !== null && !Array.isArray(teams)) throw new TypeError('new BattleCharacter(, optional array<Team> teams) expected')

    this.entity = entity

    if (teams === null) {
      this.teams = []
    } else {
      this.teams = teams.slice()
    }

    // "Self only" team; only contains this specific BattleCharacter.
    // Handy for one-on-one duels.
    this.selfOnlyTeam = new Team()
    this.teams.push(this.selfOnlyTeam)

    for (let team of this.teams) {
      team.addBattleCharacter(this)
    }

    // Dummy info, for now
    this.name = 'Cool Battle Character'
    this.maxHP = 30
    this.curHP = this.maxHP
  }

  takeDamage(power) {
    const damage = power // Nice formula
    this.curHP -= Math.min(this.curHP, damage)
    return damage
  }
}

module.exports = { BattleCharacter }
