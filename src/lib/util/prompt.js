const { RichEmbed, TextChannel, Message } = require('discord.js')

function objectAsMap(object) {
  if (!object || typeof object !== 'object') throw new TypeError('objectAsMap(object object) expected')

  if (object instanceof Map) {
    return object
  } else {
    return new Map(Object.entries(object))
  }
}

async function promptOnMessage(message, choices, userId) {
  if (!message || message instanceof Message === false) throw new TypeError('promptOnMessage(discord.Message message) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('promptOnMessage(, object | Map<anything, array<string title, Emoji emoji>> choices) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('prompt(,, string userId) expected')

  const choiceMap = objectAsMap(choices)

  // And you thought you'd never see another IIFE?!
  void (async () => {
    for (const item of Array.from(choiceMap.values())) {
      if (!item[1]) item[1] = '🔣' // FIXME :symbols:

      const [ name, emoji ] = item

      try {
        await message.react(emoji)
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
      const [ key ] = Array.from(choiceMap.entries()).find(
        ([ key, [ name, emoji ] ]) => emoji === reaction.emoji.name
      )
      return key
    })

  const parseChoiceMessage = message => {
    if (message.author.id !== userId) {
      return false
    }

    const str = message.content

    const matches = Array.from(choiceMap.entries()).filter(([ key, [ name, emoji ]]) => {
      if (str.startsWith(';') || str.startsWith(':')) {
        const textPart = str.slice(1).trim().toLowerCase()
        const lowerName = name.toLowerCase()

        if (textPart.length === 0) {
          return false
        }

        for (let i = 0; i < textPart.length; i++) {
          if (textPart[i] !== lowerName[i]) {
            return false
          }
        }

        return true
      }

      return str === emoji
    })

    if (matches.length === 1) {
      const key = matches[0][0]
      return key
    } else {
      return false
    }
  }

  const messagePromise = message.channel.awaitMessages(parseChoiceMessage, {max: 1})
    .then(messages => messages.first())
    .then(parseChoiceMessage)

  const choice = await Promise.race([reactionPromise, messagePromise])

  console.log(choice)

  return { message, choice }
}

async function prompt(channel, userId, title, choices, color = 'GREY') {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('prompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('prompt(,,, object | Map<anything, array<string title, Emoji emoji>> choices) expected')
  if (typeof color !== 'string' && typeof color !== 'number') throw new TypeError('prompt(,,,, string | color color) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(color)
    .setDescription(Array.from(objectAsMap(choices).values()).map(([ name, emoji ]) => `${emoji} ${name}`))

  const message = await channel.send(embed)

  const { choice } = await promptOnMessage(message, choices, userId)

  return { message, choice }
}

async function temporaryPrompt(channel, userId, title, choices, color = 'GREY') {
  if (!channel) throw new TypeError('temporaryPrompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('temporaryPrompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('temporaryPrompt(,, string title) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('temporaryPrompt(,,, object | Map<anything, array<string title, Emoji emoji>> choices) expected')
  if (typeof color !== 'string' && typeof color !== 'number') throw new TypeError('prompt(,,,, string | number color) expected')

  const { message, choice } = await prompt(channel, userId, title, choices, color)

  await message.delete()

  return { choice }
}

module.exports = { promptOnMessage, prompt, temporaryPrompt }
