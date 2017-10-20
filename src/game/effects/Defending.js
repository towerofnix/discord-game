// @flow

import Effect from '../../lib/Effect'

export default class DefendingEffect extends Effect {
  constructor() {
    super()
    this.name = 'Defending'
    this.type = 'defend'
    this.minValue = 0
    this.value = 1
  }

  getDisplayString(): string {
    return ''
  }
}
