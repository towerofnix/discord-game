/*
export default class BasicMapWrapperController {
  constructor() {
    this.map = new Map()
  }

  clear(...args) { return this.map.clear(...args) }
  get(...args) { return this.map.get(...args) }
  set(...args) { return this.map.set(...args) }
  has(...args) { return this.map.has(...args) }
  delete(...args) { return this.map.delete(...args) }
}
*/

import makeWrapperClass from '../util/makeWrapperClass'

console.log('Why is it so hard to get attention??')

export default class BasicMapWrapperController extends makeWrapperClass(Map) {}
