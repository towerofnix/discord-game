export default {
  name: undefined, // Should be set to a string
  type: undefined, // Should be set to a string
  value: 0,
  minValue: -Infinity,
  maxValue: +Infinity,
  decaySpeed: 1, // How quickly the value decreases
  getDisplayString: value => value > 0 ? `+${value}` : `-${-value}`,
  etc: {}, // General game-specific configuration/info can go here
}
