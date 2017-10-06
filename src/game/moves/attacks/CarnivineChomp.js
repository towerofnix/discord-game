const { BattleMove } = require('../../../lib/BattleMove.js')

class CarnivineChomp extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Chomp',
      id: 'carnivine-chomp',
      emoji: '🙄'
    })
  }

  async go(actorId, targetId, battle) {
    const bc = this.game.battleCharacters
    const aName = await bc.getName(actorId)
    const tName = await bc.getName(targetId)

    let string
    switch (await this.game.battleCharacters.getPronoun(actorId)) {
      case 'she': string = `${aName} chomps ${tName} with each of her mouths!`; break
      case 'he': string = `${aName} chomps ${tName} with each of his mouths!`; break
      case 'it': string = `${aName} chomps ${tName} with each of its mouths!`; break
      case 'they': default: string = `${aName} chomps ${tName} with each of their mouths!`
    }

    await battle.writeMoveMessage(this, 'RED', string)

    const baseDamage = 3
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}

module.exports = CarnivineChomp
