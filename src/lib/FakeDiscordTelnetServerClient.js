// @flow

import EventEmitter from 'events'

const __guild__ = Symbol()

class DiscordArray extends Array {
  first() { return this[0] }
  last() { return this[this.length - 1] }
}

class DiscordMap extends Map {
  entries() {
    return Array.from(super.entries())
  }

  filter(cb) {
    return new DiscordMap(this.entries().filter(([ k, v ]) => cb(v)))
  }

  first() {
    return this.values()[0]
  }

  _find(index, propOrCb, value) {
    let ret
    if (typeof propOrCb === 'function') {
      ret = this.entries().find(propOrCb)
    } else {
      ret = this.entries().find(v => v[propOrCb] === value)
    }
    if (ret) {
      return ret[index]
    } else {
      return ret
    }
  }

  find(propOrCb, value) {
    return this._find(1, propOrCb, value)
  }

  findKey(propOrCb, value) {
    return this._find(0, propOrCb, value)
  }

  map(cb) {
    return new DiscordMap(this.entries().map(([ k, v ]) => cb(v)))
  }

  values() {
    // Maybe not spec-compilant
    return Array.from(super.values())
  }
}

class FakeGuild {
  constructor() {
    this.channels = new DiscordMap()
    this.members = new DiscordMap()
    this.roles = new DiscordMap()
  }
}

export default class FakeDiscordTelnetServerClient extends EventEmitter {
  constructor() {
    super()

    this[__guild__] = new FakeGuild()

    this.guilds = new DiscordArray(this[__guild__])

    setTimeout(() => {
      this.emit('ready')
    }, 50)
  }
}
