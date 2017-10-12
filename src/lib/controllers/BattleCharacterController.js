import BasicDatabaseController from './BasicDatabaseController'
import { Either, Value } from '../util/checkTypes'

const shortid = require('shortid')
const Datastore = require('nedb-promise')

const db = new Datastore({
  filename: 'data/battle-characters.json',
  autoload: true,
})

export const BattleCharacterData = {
  curHP: Number,
  maxHP: Number,
  baseDefense: Number,
  baseAttack: Number,
  name: String,
  pronoun: Either(Value('they'), Value('he'), Value('she'), Value('it')),
  characterType: Either(Value('user'), Value('ai')),
  characterId: String, // ID of player or AI-character (enemy)
}

// TODO: "Destroy character" method (probably override .delete), which is
// hooked into a clean-up (which deletes old un-deleted enemies when called..
// or at least, temporary ones).

export default class BattleCharacterController extends BasicDatabaseController {
  constructor(game) {
    if (!game) throw new TypeError('new BattleCharacterController(Game game) expected')

    super(db, BattleCharacterData)

    this.game = game
  }

  async getHP(id) { return await this.getProperty(id, 'curHP') }
  async setHP(id, newHP) { return await this.setProperty(id, 'curHP', newHP) }

  async getMaxHP(id) { return await this.getProperty(id, 'maxHP') }
  async setMaxHP(id, newMaxHP) { return await this.setProperty(id, 'maxHP', newMaxHP) }

  async restoreHP(id) { return await this.setHP(id, await this.getMaxHP(id)) }

  async getBaseDefense(id) { return await this.getProperty(id, 'baseDefense') }
  async getBaseAttack(id) { return await this.getProperty(id, 'baseAttack') }

  async getCharacterType(id) { return await this.getProperty(id, 'characterType') }
  async getCharacterId(id) { return await this.getProperty(id, 'characterId') }

  async getName(id) { return await this.getProperty(id, 'name') }
  async setName(id, newName) { return await this.setProperty(id, 'name', newName) }

  async getPronoun(id) { return await this.getProperty(id, 'pronoun') }
  async setPronoun(id, newPronoun) { return await this.setProperty(id, 'pronoun', newPronoun) }

  async dealDamage(id, damage) {
    const curHP = await this.getHP(id)

    if (curHP > damage) {
      await this.setHP(id, curHP - damage)
    } else {
      await this.setHP(id, 0)
    }
  }

  async heal(id, amount) {
    const curHP = await this.getHP(id)
    const maxHP = await this.getMaxHP(id)
    await this.setHP(id, Math.min(maxHP, curHP + amount))
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
      maxHP: 10, curHP: 10,
      baseAttack: 3, baseDefense: 2,
      name,
      pronoun,
      characterType,
      characterId
    })

    return id
  }
}
