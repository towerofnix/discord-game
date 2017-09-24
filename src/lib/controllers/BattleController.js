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
      let battle = new Battle([ user ], [ new enemies.Think ])
      battle.start(game)
    })
  }

  async clean(id) {
    if (!id || typeof id !== 'string') throw new TypeError('BattleController#clean(string id) expected')

    const del = thing => thing ? thing.delete() : Promise.resolve()

    await Promise.all([
      del(this.game.guild.channels.find('name', `battle-a-${id}`)),
      del(this.game.guild.channels.find('name', `battle-b-${id}`)),
      del(this.game.guild.roles.find('name', `in battle: ${id} a`)),
      del(this.game.guild.roles.find('name', `in battle: ${id} b`)),
    ])
  }

  async cleanAll() {
    let battles = this.game.guild.channels
      .filter(c => c.name.startsWith('battle-a-'))
      .map(c => this.clean(c.name.substr(9)))

    await Promise.all(battles)
    return battles.length
  }
}

module.exports = { BattleController }
