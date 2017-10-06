const { log } = require('./util')

class BattleMove {
  constructor(game, opts) {
    if (!game) throw new TypeError('new BattleMove(Game game) expected')
    if (!opts || typeof opts !== 'object') throw new TypeError('new BattleMove(object opts) expected')

    this.game = game

    if (opts.name && typeof opts.name === 'string')
      this.name = opts.name
    else throw new TypeError('new BattleMove({ string name }) expected')

    if (opts.id && typeof opts.id === 'string')
      this.id = opts.id
    else throw new TypeError('new BattleMove({ string id }) expected')

    if (opts.emoji && typeof opts.emoji === 'string')
      this.emoji = opts.emoji
    else throw new TypeError('new BattleMove({ string emoji }) expected')

    // TODO: Target type -- select one multiple, multiple of same team, etc.
    // Maybe a more programmable way? E.g. select multiple or one is a flag,
    // then there's an array of characters that can be picked from (maybe
    // presented by team, in the UI). For now just assume each move can only
    // target one.
  }

  async go(actorBattleCharacterId, actorTeamId, targetBattleCharacterId, battleObject) {
    const bc = this.game.battleCharacters

    await log.warn(`Move ${this.name} has no go function`)

    if (targetBattleCharacterId) {
      await battleObject.writeMoveMessage(this, 'RED', `${await bc.getName(actorBattleCharacterId)} notices that the ${this.name} move doesn't have a go function, but doesn't think too much about it and launches a sick burn at ${await bc.getName(targetBattleCharacterId)}.`)
    } else {
      await battleObject.writeMoveMessage(this, 'PURPLE', `${await bc.getName(actorBattleCharacterId)} notices that the ${this.name} move doesn't have a go function, but doesn't think too much about it and does a twirl in the air.`)
    }
  }
}

module.exports = { BattleMove }
