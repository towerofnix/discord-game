const { RichEmbed, TextChannel, Message } = require('discord.js')

function parseChoiceText(str, options) {
  const matches = Object.entries(options).filter(([ key, { title, emoji }]) => {
    if (str.startsWith(';') || str.startsWith(':')) {
      const textPart = str.slice(1).trim().toLowerCase()
      const lowerTitle = title.toLowerCase()

      if (textPart.length === 0) {
        return false
      }

      for (let i = 0; i < textPart.length; i++) {
        if (textPart[i] !== lowerTitle[i]) {
          return false
        }
      }

      return true
    }

    return str === emoji
  })

  if (matches.length === 1) {
    const choice = matches[0][1]
    return choice
  } else {
    return false
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
      return options.find(choice => choice.emoji === reaction.emoji.name)
    })

  const messagePromise = message.channel.awaitMessages(message => {
    if (message.author.id !== userId) {
      return false
    }

    return parseChoiceText(message.content, options)
  }, {max: 1})
    .then(messages => messages.first())
    .then(message => parseChoiceText(message.content, options))

  const choice = await Promise.race([reactionPromise, messagePromise])

  return { message, choice }
}

async function prompt(channel, userId, title, options, color = 'GREY') {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('prompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!options || typeof options !== 'object') throw new TypeError('prompt(,,, object | Map<anything, array<string title, Emoji emoji>> options) expected')
  if (typeof color !== 'string' && typeof color !== 'number') throw new TypeError('prompt(,,,, string | color color) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(color)
    .setDescription(options.map(({ title, emoji }) => `${emoji} ${title}`))

  const message = await channel.send(embed)

  const { choice } = await promptOnMessage(message, options, userId)

  return { message, choice }
}

async function temporaryPrompt(channel, userId, title, options, color = 'GREY') {
  if (!channel) throw new TypeError('temporaryPrompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('temporaryPrompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('temporaryPrompt(,, string title) expected')
  if (!options || typeof options !== 'object') throw new TypeError('temporaryPrompt(,,, object | Map<anything, array<string title, Emoji emoji>> options) expected')
  if (typeof color !== 'string' && typeof color !== 'number') throw new TypeError('prompt(,,,, string | number color) expected')

  const { message, choice } = await prompt(channel, userId, title, options, color)

  await message.delete()

  return { choice }
}

module.exports = { promptOnMessage, prompt, temporaryPrompt }
