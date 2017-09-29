const { BattleMove } = require('./BattleMove')

class Attack extends BattleMove {
  constructor(game, opts) {
    super(game, opts)

    if (opts.type === 'physical' || opts.type === 'magical')
      this.type = opts.type
    else throw new TypeError('new Attack({ string type [physical|magical] }) expected')

    if (opts.power)
      this.power = opts.power
    else throw new TypeError('new Attack({ number power }) expected')
  }
}

module.exports = { Attack }
