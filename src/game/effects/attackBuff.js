import baseEffect from '../../lib/baseEffect'

export default Object.assign({}, baseEffect, {
  name: 'Attack buff',
  type: 'attack-buff',
  maxValue: +5,
  minValue: -5,
  etc: {
    disruptable: true,
  },
})
