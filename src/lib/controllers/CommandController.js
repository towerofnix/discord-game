const EventEmitter = require('events')

const PREFIX = '.'

class CommandController extends EventEmitter {
  constructor(game) {
    if (!game) throw new TypeError('new CommandController(Game game) expected')
    super()

    game.client.on('message', msg => this.handleMessage(msg))
  }

  // TODO automagic .help messages?

  handleMessage(message) {
    if (!message)
      throw new TypeError('CommandController.handleMessage(discord.Message message) expected')

    if (!message.content.startsWith(PREFIX)) return // not a command

    let content = message.content.substr(PREFIX.length)

    // we won't parse the content here - leave that up to the listener

    let eocIndex = content.indexOf(' ') // end of command index
    if (eocIndex === -1) eocIndex = content.length

    let command = content.substr(0, eocIndex)
    let rest = content.substr(eocIndex + 1).trim()

    this.emit('.' + command, command, rest, message)
    this.emit('*',           command, rest, message)
  }
}

module.exports = { CommandController }
