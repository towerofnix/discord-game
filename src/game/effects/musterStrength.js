import baseEffect from '../../lib/baseEffect'

export default Object.assign({}, baseEffect, {
  name: 'Mustered strength',
  type: 'attack-buff',
  value: 8,
  decaySpeed: 4,
  getDisplayString: () => '',
})
