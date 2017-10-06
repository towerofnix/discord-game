const { BattleMove } = require('../../../lib/BattleMove')

class AirRatSummonAllies extends BattleMove {
  constructor(game) {
    super(game, {
      name: 'Summon Allies',
      id: 'air-rat-summon-allies',
      emoji: '📣' // :megaphone:
    })
  }

  async go(actorId, actorTeamId, targetId, battle) {
    const name = await this.game.battleCharacters.getName(actorId)

    await battle.writeMoveMessage(this, 'RED', `${name} lets out an ear-wrenching screech!`)

    const targets = await battle.getAllCharacters()
      .then(chars => Promise.all(chars.map(async char => {
        if (await this.game.battleCharacters.getCharacterType(char) === 'ai') {
          if (await this.game.battleCharacters.getCharacterId(char) === 'air-rat') {
            return false
          }
        }
        return char
      })))
      .then(chars => chars.filter(char => char !== false))

    // TODO: Figure out how to show who took which damage
    // (At the moment, it just displays "Deals 1 damage."/etc once for each player)
    const baseDamage = 1
    for (const targetId of targets) {
      const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
      await battle.dealDamageToCharacter(this, targetId, damage)
    }

    const summoned = Math.round(Math.random() * 3)

    if (summoned === 0) {
      await battle.writeMoveMessage(this, 'RED', 'But no air rats appear.')
    } else {
      if (summoned === 1) {
        await battle.writeMoveMessage(this, 'RED', 'Another air rat suddenly appears out of thin air!')
      } else {
        await battle.writeMoveMessage(this, 'RED', `${summoned} air rats suddenly appear out of thin air!`)
      }

      for (let i = 0; i < summoned; i++) {
        const allyId = await this.game.battleCharacters.createForCharacter('ai', 'air-rat', this.game.battleAIs.get('air-rat').name, 'it')
        await this.game.teams.addMember(actorTeamId, allyId)
        await battle.setTemporaryEffect(allyId, 'silentIdle', 1)
      }
    }
  }
}

module.exports = AirRatSummonAllies
