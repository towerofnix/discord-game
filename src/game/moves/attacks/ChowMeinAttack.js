import BattleMove from '../../../lib/BattleMove'

export default class ChowMeinAttack extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Attack',
      id: 'chow-mein-attack',
      emoji: '👊' // :punch:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const bc = this.game.battleCharacters
    const aName = await bc.getName(actorId)
    const tName = await bc.getName(targetId)

    let str

    switch (await bc.getPronoun(actorId)) {
      case 'she': str = `${aName} chops ${tName} with her flat palm!`; break
      case 'he': str = `${aName} chops ${tName} with his flat palm!`; break
      case 'it': str = `${aName} chops ${tName} with its flat palm!`; break
      case 'they': default: str = `${aName} chops ${tName} with their flat palm!`
    }

    await battle.writeMoveMessage(this, 'RED', str)

    const baseDamage = 4
    const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
    await battle.dealDamageToCharacter(this, targetId, damage)
  }
}
