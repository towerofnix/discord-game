const { BasicDatabaseController } = require('./BasicDatabaseController')

const shortid = require('shortid')
const Datastore = require('nedb-promise')

const db = new Datastore({
  filename: 'data/battle-characters.json',
  autoload: true,
})

const BattleCharacterData = {
  hp: Number, name: String,
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

  async getCharacterType(id) {
    return await this.getProperty(id, 'characterType')
  }

  async getCharacterId(id) {
    return await this.getProperty(id, 'characterId')
  }

  async getName(id) {
    return await this.getProperty(id, 'name')
  }

  async setName(id, newName) {
    return await this.setProperty(id, 'name', newName)
  }

  async createForCharacter(characterType, characterId, name = 'Unnamed Battle Character') {
    if (characterType !== 'user' && characterType !== 'ai') throw new TypeError('BattleCharacterController#createForCharacter(string ("user", "ai") characterType) expected')
    if (!characterId || typeof characterId !== 'string') throw new TypeError('BattleCharacterController#createForCharacter(, string characterId) expected')
    if (!name || typeof name !== 'string') throw new TypeError('BattleCharacterController#createForcharacter(,, optional string name) expected')

    const id = shortid.generate().toLowerCase()

    await this.add(id, { hp: 10, name, characterType, characterId })

    return id
  }
}

module.exports = { BattleCharacterController, BattleCharacterData }
