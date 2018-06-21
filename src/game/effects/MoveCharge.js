import Effect from '../../lib/Effect'

export default class MoveChargeEffect extends Effect {
  constructor() {
    super()
    this.name = 'Move charge'
    this.type = 'move-charge'
    this.maxValue = Infinity
    this.minValue = 0
    this.decaySpeed = 0
  }
}
