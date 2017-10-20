// @flow

import Effect from '../../lib/Effect'

export default class MusteredStrengthEffect extends Effect {
  constructor() {
    super()
    this.name = 'Mustered strength'
    this.type = 'attack-buff'
    this.value = 8
    this.decaySpeed = 4
  }

  getDisplayString(): string {
    return ''
  }
}
