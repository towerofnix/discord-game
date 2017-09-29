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

  getActionString(user, target) {
    // Takes two BattleCharacters (not entities).

    return `${user.name} notices that the ${this.name} move doesn't have an action string, but doesn't think too much about it and launches a sick burn at ${target.name}.`
  }
}

module.exports = { BattleMove }
