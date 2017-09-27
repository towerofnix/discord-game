const EventEmitter = require('events')

const { Battle } = require('../Battle')
const { User } = require('../User')
const enemies = require('../../game/enemies')

class BattleController extends EventEmitter {
  constructor(game) {
    if (!game) throw new TypeError('new BattleController(Game game) expected')
    super()

    this.game = game
    this.game.commandController.on('.battle', async (cmd, args, { member }) => {
      // TEMP
      const user = await User.getById(member.id)
      let battle = new Battle([
        user.battleCharacter.teams[0],
        new enemies.Think().battleCharacter.teams[0]
      ])
      battle.start(game)
    })
  }
}

module.exports = { BattleController }
