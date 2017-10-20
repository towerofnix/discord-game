// @flow

import BasicDatabaseController from './BasicDatabaseController'
import Game from '../Game'
import { either, value } from '../util/checkTypes'

import shortid from 'shortid'
import Datastore from 'nedb-promise'

type Pvoid = Promise<void>

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
  pronoun: either(value('they'), value('he'), value('she'), value('it')),
  characterType: either(value('user'), value('ai')),
  characterId: String, // ID of player or AI-character (enemy)
}

// TODO: "Destroy character" method (probably override .delete), which is
// hooked into a clean-up (which deletes old un-deleted enemies when called..
// or at least, temporary ones).

export default class BattleCharacterController extends BasicDatabaseController {
  game: Game

  constructor(game: Game) {
    if (!game) throw new TypeError('new BattleCharacterController(Game game) expected')

    super(db, BattleCharacterData)

    this.game = game
  }

  async getHP(id: string): Promise<number> { return await this.getProperty(id, 'curHP') }
  async setHP(id: string, newHP: number): Pvoid { await this.setProperty(id, 'curHP', newHP) }

  async getMaxHP(id: string): Promise<number> { return await this.getProperty(id, 'maxHP') }
  async setMaxHP(id: string, newMaxHP: number): Pvoid { await this.setProperty(id, 'maxHP', newMaxHP) }

  async restoreHP(id: string): Pvoid { await this.setHP(id, await this.getMaxHP(id)) }

  async getBaseDefense(id: string): Promise<number> { return await this.getProperty(id, 'baseDefense') }
  async getBaseAttack(id: string): Pvoid { return await this.getProperty(id, 'baseAttack') }

  async getCharacterType(id: string): Promise<string> { return await this.getProperty(id, 'characterType') }
  async getCharacterId(id: string): Promise<string> { return await this.getProperty(id, 'characterId') }

  async getName(id: string): Promise<string> { return await this.getProperty(id, 'name') }
  async setName(id: string, newName: string): Pvoid { await this.setProperty(id, 'name', newName) }

  async getPronoun(id: string): Promise<string> { return await this.getProperty(id, 'pronoun') }
  async setPronoun(id: string, newPronoun: string): Pvoid { await this.setProperty(id, 'pronoun', newPronoun) }

  async dealDamage(id: string, damage: number): Pvoid {
    const curHP = await this.getHP(id)

    if (curHP > damage) {
      await this.setHP(id, curHP - damage)
    } else {
      await this.setHP(id, 0)
    }
  }

  async heal(id: string, amount: number): Pvoid {
    const curHP = await this.getHP(id)
    const maxHP = await this.getMaxHP(id)
    await this.setHP(id, Math.min(maxHP, curHP + amount))
  }

  async isAlive(id: string): Promise<boolean> {
    return await this.getHP(id) > 0
  }

  async isDead(id: string): Promise<boolean> {
    return await this.isAlive(id) === false
  }

  async createForCharacter(characterType: string, characterId: string, documentConfig: Object = {}): Promise<string> {
    const id = shortid.generate().toLowerCase()

    const doc = Object.assign({
      maxHP: 10,
      baseAttack: 3, baseDefense: 2,
      name: 'Unnamed Battle Character',
      pronoun: 'they',
      characterType,
      characterId
    }, documentConfig)

    // Fully heal the character so that its current HP is the same as its max HP,
    // unless the passed document configuration gives a specific current HP.
    if ('curHP' in documentConfig === false) {
      doc.curHP = doc.maxHP
    }

    await this.add(id, doc)

    return id
  }
}
