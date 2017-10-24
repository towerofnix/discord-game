// @flow

import BattleMove from '../../../lib/BattleMove'
import Game from '../../../lib/Game'
import Battle from '../../../lib/Battle'
import SilentlyIdling from '../../effects/SilentlyIdling'
import asyncFilter from '../../../lib/util/asyncFilter'

export default class AirRatSummonAllies extends BattleMove {
  constructor(game: Game) {
    super(game, {
      name: 'Summon Allies',
      id: 'air-rat-summon-allies',
      emoji: '📣' // :megaphone:
    })
  }

  async go(actorId: string, actorTeamId: string, targetId: string, battle: Battle): Promise<void> {
    const name = await this.game.battleCharacters.getName(actorId)

    await battle.writeMoveMessage(this, 'RED', `${name} lets out an ear-wrenching screech!`)

    const targets = await battle.getAllCharacters()
      .then(asyncFilter(async (char: string): Promise<boolean> => {
        if (await this.game.battleCharacters.getCharacterType(char) === 'ai') {
          if (await this.game.battleCharacters.getCharacterId(char) === 'air-rat') {
            return false
          }
        }
        if (await this.game.battleCharacters.getHP(char) <= 0) {
          return false
        }
        return true
      }))

    // TODO: Figure out how to show who took which damage
    // (At the moment, it just displays "Deals 1 damage."/etc once for each player)
    const baseDamage = 1
    for (const targetId of targets) {
      const damage = await battle.getBasicDamage(baseDamage, actorId, targetId)
      await battle.dealDamageToCharacter(this, targetId, damage)
    }

    let summoned = Math.round(Math.random() * 3)

    const members = await this.game.teams.getMembers(actorTeamId)

    // FIXME: Don't use a hard-coded limit here! Probably store the constant
    // on TeamController, e.g. this.game.teams.MAX_MEMBERS. Also, enforce the
    // limit inside of TeamController.
    if (members.length + summoned > 8) {
      summoned = 8 - members.length
    }

    if (summoned === 0) {
      await battle.writeMoveMessage(this, 'RED', 'But no air rats appear.')
    } else {
      if (summoned === 1) {
        await battle.writeMoveMessage(this, 'RED', 'Another air rat suddenly appears out of thin air!')
      } else {
        await battle.writeMoveMessage(this, 'RED', `${summoned} air rats suddenly appear out of thin air!`)
      }

      for (let i = 0; i < summoned; i++) {
        // TODO: Specifying name like that is bad. Should use the default object thing.
        const allyId = await this.game.battleCharacters.createForCharacter('ai', 'air-rat', {name: this.game.battleAIs.get('air-rat').name, pronoun: 'it'})
        await this.game.teams.addMember(actorTeamId, allyId)
        await battle.addTemporaryEffect(allyId, new SilentlyIdling())
      }
    }
  }
}
