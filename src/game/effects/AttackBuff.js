// @flow

import Effect from '../../lib/Effect'

export default class AttackBuffEffect extends Effect {
  constructor() {
    super()
    this.name = 'Attack buff'
    this.type = 'attack-buff'
    this.maxValue = +5
    this.minValue = -5
    this.etc = {
      disruptable: true
    }
  }
}
