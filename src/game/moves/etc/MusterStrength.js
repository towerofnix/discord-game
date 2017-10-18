import BattleMove from '../../../lib/BattleMove'

export default class MusterStrength extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Muster Strength',
      id: 'muster-strength',
      emoji: '💪' // :muscle:
      // TODO: Figure out how to only target self.
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)

    let str
    switch (await this.game.battleCharacters.getPronoun(actorId)) {
      case 'she': str = `${name} musters her strength!`; break
      case 'he': str = `${name} musters his strength!`; break
      case 'it': str = `${name} musters its strength!`; break
      case 'they': default: str = `${name} musters their strength!`
    }

    await battle.writeMoveMessage(this, 'GREY', str)

    battle.addTemporaryEffect(actorId, {
      name: 'Strength Mustered',
      getDisplayString: () => '',
      type: 'attack-buff',
      value: 8,
      decaySpeed: 4
    })
  }
}
