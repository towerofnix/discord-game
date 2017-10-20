// @flow

import Effect from '../../lib/Effect'

export default class DefenseBuffEffect extends Effect {
  constructor() {
    super()
    this.name = 'Defense buff'
    this.type = 'defense-buff'
    this.maxValue = +5
    this.minValue = -5
    this.etc = {
      disruptable: true
    }
  }
}
