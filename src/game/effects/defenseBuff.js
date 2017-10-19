import baseEffect from '../../lib/baseEffect'

export default Object.assign({}, baseEffect, {
  name: 'Defense buff',
  type: 'defense-buff',
  maxValue: +5,
  minValue: -5,
  etc: {
    disruptable: true,
  },
})
