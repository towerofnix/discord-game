class BattleAI {
  constructor(opts) {
    if (!opts || typeof opts !== 'object') throw new TypeError('new Enemy(object opts) expected')

    if (opts.id && typeof opts.id === 'string')
      this.id = opts.id
    else throw new TypeError('new Enemy({ string id }) expected')

    if (opts.name && typeof opts.name === 'string')
      this.name = opts.name
    else throw new TypeError('new Enemy({ string name }) expected')
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    return { type: 'use move', move: battle.game.moves.get('skip-turn') }
  }
}

module.exports = { BattleAI }
