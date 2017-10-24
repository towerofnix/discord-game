// @flow

import Effect from '../../lib/Effect'

export default class SilentlyIdlingEffect extends Effect {
  constructor() {
    super()
    this.name = 'Idling [Silent]'
    this.type = 'silentIdle' // Don't show "Character is idle" message like idle effect does.
    this.minValue = 0
    this.value = 1
    this.silent = true // Don't show this in the user-visible effect list.
  }
}
