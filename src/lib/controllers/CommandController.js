import BasicMaplikeController from './BasicMaplikeController'
import { warn } from '../util/log'
import { promptOnMessage } from '../util/prompt'
import richWrite from '../util/richWrite'

export const PREFIX = '.'

export default class CommandController extends BasicMaplikeController {
  // Command controller map. Add entries to the map to act as command handlers;
  // for example: commandController.set('.warp', (rest, message) => {})
  // Also contains a utility function for adding a verb command (these are used
  // for interacting with the room).

  constructor(game) {
    if (!game) throw new TypeError('new CommandController(Game game) expected')

    super()

    this.game = game
  }

  // TODO automagic .help messages?

  setupMessageListener() {
    // Adds the "on message" handler to the Discord client.
    // Separated from the constructor because, arguably, the constructor
    // should not run any side-effects.
    this.game.client.on('message', msg => this.handleMessage(msg))
  }

  async handleMessage(message) {
    if (!message)
      throw new TypeError('CommandController.handleMessage(discord.Message message) expected')

    if (!message.content.startsWith(PREFIX)) return // Not a command

    const content = message.content.substr(PREFIX.length)

    // We won't parse the content (past the command) here - leave that up to
    // the command's handler function

    let eocIndex = content.indexOf(' ') // End of command index
    if (eocIndex === -1) eocIndex = content.length

    const command = content.substr(0, eocIndex)
    const rest = content.substr(eocIndex + 1).trim()

    if (this.has(command)) {
      const commandHandler = this.get(command)
      await commandHandler(rest, message)
    } else {
      warn(`${message.author.tag} used nonexistant command "${command}": ${message.content}`)
    }
  }

  addVerb(verb) {
    if (!verb || typeof verb !== 'string') throw new TypeError('CommandController#addVerb(string verb) expected')

    this.set(verb, async (rest, message) => {
      const userId = message.author.id
      const location = await this.game.users.getLocation(userId)

      if (this.game.rooms.has(location) === false) {
        warn(`User ${message.author.tag} attempted to use a verb (${verb} ${rest}) while in nonexistant room "${location}"!`)
        return false
      }

      const { channel } = await this.game.rooms.getChannelAndRole(location)

      const roomObject = this.game.rooms.get(location)
      const choices = await roomObject.getVerbChoices(verb, userId)

      let choice
      let validChoice

      if (rest.length > 0) {
        // TODO: "Simplify" this string - remove common English words, like "the"
        choice = rest.toLowerCase()

        const match = choices.find(c => c.title === choice || c.emoji === choice)

        if (match) {
          choice = match
          validChoice = true
        } else {
          validChoice = false
        }
      } else {
        choice = (await promptOnMessage(message, choices, userId)).choice
        validChoice = true
      }

      if (validChoice) {
        await roomObject.handleVerbChoice(verb, choice, userId, this.game)
      } else {
        await richWrite(channel, 0xBB4444, 'Invalid choice!', `That isn't a valid thing to ${verb}.`)
      }
    })
  }
}
