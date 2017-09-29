const { BasicDatabaseController } = require('./BasicDatabaseController')

const shortid = require('shortid')
const Datastore = require('nedb-promise')

const db = new Datastore({
  filename: 'data/battle-characters.json',
  autoload: true,
})

const BattleCharacterData = {
  hp: Number,
  characterType: String, characterId: String,
}

class BattleCharacterController extends BasicDatabaseController {
  constructor(game) {
    if (!game) throw new TypeError('new BattleCharacterController(Game game) expected')

    super(db, BattleCharacterData)

    this.game = game
  }

  async getHp(id) {
    return await this.getProperty(id, 'hp')
  }

  async setHp(id, newHP) {
    return await this.setProperty(id, 'hp', newHP)
  }

  async createForCharacter(characterType, characterId) {
    if (characterType !== 'player' && characterType !== 'ai') throw new TypeError('BattleCharacterController#createForCharacter(string ("player", "ai") characterType) expected')
    if (!characterId || typeof characterId !== 'string') throw new TypeError('BattleCharacterController#createForCharacter(, string characterId) expected')

    const id = shortid.generate().toLowerCase()

    await this.add(id, { hp: 10, characterType, characterId })

    return id
  }
}

module.exports = { BattleCharacterController, BattleCharacterData }
