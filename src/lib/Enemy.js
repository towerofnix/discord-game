const { BattleCharacter } = require('./BattleCharacter')

class Enemy {
  // TODO

  constructor() {
    this.battleCharacter = new BattleCharacter(this)
  }
}

module.exports = { Enemy }
