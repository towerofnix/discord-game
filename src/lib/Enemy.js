const { BattleCharacter } = require('./BattleCharacter')

class Enemy {
  constructor(opts) {
    if (!opts) throw new TypeError('new Enemy(object opts) expected')

    if (opts.name)
      this.name = opts.name
    else throw new TypeError('new Enemy({ string name }) expected')

    this.battleCharacter = new BattleCharacter(this)
    this.battleCharacter.name = this.name
  }
}

module.exports = { Enemy }
