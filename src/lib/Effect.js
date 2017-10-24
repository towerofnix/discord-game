// @flow

export default class Effect {
  name: string
  type: string

  value: number
  minValue: number
  maxValue: number
  decaySpeed: number // See tick() method

  silent: boolean

  etc: Object

  constructor() {
    this.value = 0
    this.minValue = -Infinity
    this.maxValue = +Infinity
    this.decaySpeed = 1
    this.etc = {}
  }

  getDisplayString(value: number): string {
    if (value > 0) {
      return `+${value}`
    } else {
      return `${value}`
    }
  }

  constrainValue() {
    if (this.value < this.minValue) {
      this.value = this.minValue
    } else if (this.value > this.maxValue) {
      this.value = this.maxValue
    }
  }

  tick() {
    // Decay speed controls how quickly the effect's value disappears.
    // Higher means faster; zero means the effect won't be automatically
    // removed (or decreased). Negative means the effect will actually
    // become stronger over time. Defaults to 1 (so the value decreases
    // by 1 each turn).
    const { decaySpeed = 1 } = this

    if (decaySpeed > Math.abs(this.value)) {
      this.value = 0
    } else {
      this.value -= Math.sign(this.value) * decaySpeed
    }
  }
}
