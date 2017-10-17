const { RichEmbed, TextChannel, Message } = require('discord.js')

function parseChoiceText(str, options) {
  if (str.startsWith(';') || str.startsWith(':')) {
    str = str.slice(1)
  }

  const matches = options.map(option => {
    const { title, emoji } = option

    // Test for an emoji match, first. But we can only do that if there's
    // at least one character in the string..
    if (str.length >= 1) {
      const firstChar = String.fromCodePoint(str.codePointAt(0))
      if (firstChar === emoji) {
        return { rest: str.slice(firstChar.length), choice: option }
      }
    } else {
      // If the string is empty, then we definitely aren't going to match
      // anything!
      return false
    }

    // If there's no emoji match, we'll see if there's any text match between
    // the input and the title.

    const textPart = str.trim().toLowerCase()
    const lowerTitle = title.toLowerCase()

    if (textPart.length === 0) {
      return false
    }

    for (let i = 0; i < textPart.length; i++) {
      // If the current input character is not the same as the corresponding
      // character in the title, then we'll PROBABLY stop here, but..
      if (textPart[i] !== lowerTitle[i]) {
        // ..But, if we've just found a space, or we are currently on a
        // space and we just passed the length of the title, the user
        // probably meant to pass this new title to something later in a
        // menu. So, we stop here, and return the text past the current
        // character index, so that the prompt caller will know where to
        // continue if it wants to use that.
        if (textPart[i] === ' ' || i >= lowerTitle.length) {
          return { rest: textPart.slice(i), choice: option }
        } else {
          return false
        }
      }
    }

    // We made it past! The title completely matches the input. Since we got
    // all the way past the string, we can say we stopped at the end, so we
    // don't put anything in the rest string.
    return { rest: '', choice: option }
  }).filter(x => x !== false)

  if (matches.length === 1) {
    matches[0].rest = matches[0].rest.trim()
    return matches[0]
  } else {
    return null
  }
}

async function promptOnMessage(message, options, userId) {
  if (!message || message instanceof Message === false) throw new TypeError('promptOnMessage(discord.Message message) expected')
  if (!options || typeof options !== 'object') throw new TypeError('promptOnMessage(, Array<object<string title, string emoji>>) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('prompt(,, string userId) expected')

  // And you thought you'd never see another IIFE?!
  void (async () => {
    for (const item of options) {
      try {
        await message.react(item.emoji || '🔣') // FIXME :symbols:
      } catch(err) {
        if (err.message === 'Unknown Message') {
          return
        } else {
          throw err
        }
      }
    }
  })()

  const reactionPromise = message.awaitReactions(reaction => {
    return reaction.users.find('id', userId)
  }, {max: 1})
    .then(reactions => reactions.first())
    .then(reaction => {
      return { choice: options.find(choice => choice.emoji === reaction.emoji.name) }
    })

  const messagePromise = message.channel.awaitMessages(message => {
    if (message.author.id !== userId) {
      return false
    }

    if (
      /^([:;]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F])/.test(message.content)
    ) {
      return parseChoiceText(message.content, options)
    }
  }, {max: 1})
    .then(messages => messages.first())
    .then(message => parseChoiceText(message.content, options))

  const ret = await Promise.race([reactionPromise, messagePromise])

  return Object.assign({ message }, ret)
}

async function prompt(channel, userId, title, options, color = 'GREY', description = '') {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('prompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!options || typeof options !== 'object') throw new TypeError('prompt(,,, object | Map<anything, array<string title, Emoji emoji>> options) expected')
  if (typeof color !== 'string' && typeof color !== 'number') throw new TypeError('prompt(,,,, string | color color) expected')
  if (typeof description !== 'string') throw new TypeError('prompt(,,,,, string description) expected')

  if (description !== '')
    description += '\n\n'

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(color)
    .setDescription(description + options.map(({ title, emoji }) => `${emoji} ${title}`).join('\n'))

  const message = await channel.send(embed)

  return await promptOnMessage(message, options, userId)
}

async function temporaryPrompt(channel, userId, title, options, color = 'GREY', description = '') {
  if (!channel) throw new TypeError('temporaryPrompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('temporaryPrompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('temporaryPrompt(,, string title) expected')
  if (!options || typeof options !== 'object') throw new TypeError('temporaryPrompt(,,, object | Map<anything, array<string title, Emoji emoji>> options) expected')
  if (typeof color !== 'string' && typeof color !== 'number') throw new TypeError('temporaryPrompt(,,,, string | number color) expected')
  if (typeof description !== 'string') throw new TypeError('temporaryPrompt(,,,,, string description) expected')

  const ret = await prompt(channel, userId, title, options, color, description)

  await ret.message.delete()
  delete ret.message

  return ret
}

module.exports = { promptOnMessage, prompt, temporaryPrompt, parseChoiceText }
