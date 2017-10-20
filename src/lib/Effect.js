// @flow

export default class Effect {
  name: string
  type: string

  value: number
  minValue: number
  maxValue: number
  decaySpeed: number

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
}
