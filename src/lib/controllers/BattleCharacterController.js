const { BasicDatabaseController } = require('./BasicDatabaseController')

const shortid = require('shortid')
const Datastore = require('nedb-promise')

const db = new Datastore({
  filename: 'data/battle-characters.json',
  autoload: true,
})

const BattleCharacterData = {
  curHP: Number,
  maxHP: Number,
  name: String,
  pronoun: String, // they, he, she, it
  characterType: String, // player, ai
  characterId: String, // ID of player or AI-character (enemy)
}

class BattleCharacterController extends BasicDatabaseController {
  constructor(game) {
    if (!game) throw new TypeError('new BattleCharacterController(Game game) expected')

    super(db, BattleCharacterData)

    this.game = game
  }

  async getHP(id) {
    return await this.getProperty(id, 'curHP')
  }

  async setHP(id, newHP) {
    return await this.setProperty(id, 'curHP', newHP)
  }

  async getMaxHP(id) {
    return await this.getProperty(id, 'maxHP')
  }

  async setMaxHP(id, newMaxHP) {
    return await this.setProperty(id, 'maxHP', newMaxHP)
  }

  async restoreHP(id) {
    return await this.setHP(id, await this.getMaxHP(id))
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

  async getPronoun(id) {
    return await this.getProperty(id, 'pronoun')
  }

  async setPronoun(id, newPronoun) {
    return await this.setProperty(id, 'pronoun', newPronoun)
  }

  async dealDamage(id, damage) {
    const curHP = await this.getHP(id)

    if (curHP > damage) {
      await this.setHP(id, curHP - damage)
    } else {
      await this.setHP(id, 0)
    }
  }

  async isAlive(id) {
    return await this.getHP(id) > 0
  }

  async isDead(id) {
    return await this.isAlive(id) === false
  }

  async createForCharacter(characterType, characterId, name = 'Unnamed Battle Character', pronoun = 'they') {
    if (characterType !== 'user' && characterType !== 'ai') throw new TypeError('BattleCharacterController#createForCharacter(string ("user", "ai") characterType) expected')
    if (!characterId || typeof characterId !== 'string') throw new TypeError('BattleCharacterController#createForCharacter(, string characterId) expected')
    if (!name || typeof name !== 'string') throw new TypeError('BattleCharacterController#createForCharacter(,, optional string name) expected')
    if (!pronoun || typeof pronoun !== 'string') throw new TypeError('BattleCharacterController#createForCharacter(,, optional string pronoun) expected')

    const id = shortid.generate().toLowerCase()

    await this.add(id, {
      maxHP: 2, curHP: 2, // TODO: For debugging! Change to 10 later.
      name,
      pronoun,
      characterType,
      characterId
    })

    return id
  }
}

module.exports = { BattleCharacterController, BattleCharacterData }
