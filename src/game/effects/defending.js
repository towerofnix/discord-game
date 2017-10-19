import baseEffect from '../../lib/baseEffect'

export default Object.assign({}, baseEffect, {
  name: 'Defending',
  type: 'defend',
  getDisplayString: () => '',
  minValue: 0,
  value: 1,
})
