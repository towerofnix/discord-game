const { log } = require('../util')

class EnemyController extends Map {
  constructor(game) {
    super()

    this.game = game
  }

  async register(enemyObject) {
    await log.info(`Registering enemy: ${enemyObject.name} (ID: ${enemyObject.id})`)
    this.set(enemyObject.id, enemyObject.name)
  }
}

module.exports = { EnemyController }
