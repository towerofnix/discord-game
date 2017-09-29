const { log } = require('../util')

// TODO: "Destroy enemy" method (probably override .delete), which is hooked
// into a clean-up (which deletes old un-deleted enemies when called.. or
// at least, temporary ones).

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
