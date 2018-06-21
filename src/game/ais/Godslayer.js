import BattleAI from '../../lib/BattleAI'

export default class Godslayer extends BattleAI {
  constructor() {
    super({
      name: 'Godslayer',
      id: 'godslayer'
    })
  }

  async chooseAction(myBattleCharacterId, myTeamId, battle) {
    return { type: 'use move', move: 'godslayer', target: await this.getOpponents(myTeamId, battle) }
  }

  getDefaultBattleCharacter() {
    return {
      pronoun: 'it',
      maxHP: 50000
    }
  }
}
