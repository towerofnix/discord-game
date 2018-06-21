// @flow

import EventEmitter from 'events'

const __guild__ = Symbol()

class FakeGuild {
}

export default class FakeDiscordTelnetServerClient extends EventEmitter {
  constructor() {
    super()

    this[__guild__] = new FakeGuild()

    this.guilds = {first: () => this[__guild__]}
  }
}
