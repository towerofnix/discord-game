import { warn } from './util/log'
import checkTypes, { Maybe } from './util/checkTypes'

export default class BattleMove {
  constructor(game, opts) {
    if (!game) throw new TypeError('new BattleMove(Game game) expected')
    if (!opts || typeof opts !== 'object') throw new TypeError('new BattleMove(object opts) expected')

    this.game = game

    if (!checkTypes(opts, {
      name: String,
      id: String,
      emoji: String,
      targetFilter: Maybe(Function), // only applies to user moves
    }, true)) throw new TypeError('new BattleMove(opts) typecheck failed')

    this.name = opts.name
    this.id = opts.id
    this.emoji = opts.emoji
    this.targetFilter = opts.targetFilter || (() => Promise.resolve(true))

    // TODO: Target type -- select one multiple, multiple of same team, etc.
    // Maybe a more programmable way? E.g. select multiple or one is a flag,
    // then there's an array of characters that can be picked from (maybe
    // presented by team, in the UI). For now just assume each move can only
    // target one.
  }

  async go(actorBattleCharacterId, actorTeamId, targetBattleCharacterId, battleObject) {
    const bc = this.game.battleCharacters

    await log.warn(`BattleMove ${this.name} has no #go() function`)

    if (targetBattleCharacterId) {
      await battleObject.writeMoveMessage(this, 'RED', `${await bc.getName(actorBattleCharacterId)} notices that the ${this.name} move doesn't have a go function, but doesn't think too much about it and launches a sick burn at ${await bc.getName(targetBattleCharacterId)}.`)
    } else {
      await battleObject.writeMoveMessage(this, 'PURPLE', `${await bc.getName(actorBattleCharacterId)} notices that the ${this.name} move doesn't have a go function, but doesn't think too much about it and does a twirl in the air.`)
    }
  }
}

export async function deadOnly(id, game) {
  let isAlive = await game.battleCharacters.isAlive(id)
  return !isAlive
}

export async function aliveOnly(id, game) {
  let isAlive = await game.battleCharacters.isAlive(id)
  return isAlive
}
