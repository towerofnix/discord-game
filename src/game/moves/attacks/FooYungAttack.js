import BattleMove from '../../../lib/BattleMove'

export default class FooYungAttack extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Attack',
      id: 'foo-yung-attack',
      emoji: '⚔' // :crossed_swords:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    const aName = await bc.getName(actorId)
    const tName = await bc.getName(targetId)

    let str
    switch (await bc.getPronoun(actorId)) {
      case 'she': str = `${aName} swings her swords at ${tName}!`; break
      case 'he': str = `${aName} swings his swords at ${tName}!`; break
      case 'it': str = `${aName} swings its swords at ${tName}!`; break
      case 'they': default: str = `${aName} swings their swords at ${tName}!`
    }
    await battle.writeMoveMessage(this, 'RED', str)

    const baseDamage = 5
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}
