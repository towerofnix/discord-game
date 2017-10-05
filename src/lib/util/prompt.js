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
  const addReactsMap = (async () => {
    for (const item of Array.from(choiceMap.values())) {
      if (!item[1]) item[1] = '🔣' // FIXME :sneezing:

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

  const reactions = await message.awaitReactions(reaction => {
    return reaction.users.find('id', userId)
  }, {max: 1})

  const reaction = reactions.first()

  const [ key ] = Array.from(choiceMap.entries()).find(
    ([ key, [ name, emoji ] ]) => emoji === reaction.emoji.name
  )

  return { message, choice: key }
}

async function prompt(channel, userId, title, choices, color = 'GREY') {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!userId || typeof userId !== 'string') throw new TypeError('prompt(, string userId) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('prompt(,,, object | Map<anything, array<string title, Emoji emoji>> choices) expected')
  if (!color) throw new TypeError('prompt(,,,, ColorResolvable color) expected')

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
  if (!color) throw new TypeError('prompt(,,,, ColorResolvable color) expected')

  const { message, choice } = await prompt(channel, userId, title, choices, color)

  await message.delete()

  return { choice }
}

module.exports = { promptOnMessage, prompt, temporaryPrompt }
