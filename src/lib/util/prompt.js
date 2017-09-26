const { RichEmbed, TextChannel, Message } = require('discord.js')
const { User } = require('../User')

function objectAsMap(object) {
  if (!object || typeof object !== 'object') throw new TypeError('objectAsMap(object object) expected')

  if (object instanceof Map) {
    return object
  } else {
    return new Map(Object.entries(object))
  }
}

async function promptOnMessage(message, choices, user) {
  if (!message || message instanceof Message === false) throw new TypeError('promptOnMessage(discord.Message message) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('promptOnMessage(, object | Map<anything, array<string title, Emoji emoji>> choices) expected')
  if (!user || user instanceof User === false) throw new TypeError('prompt(,, User user) expected')

  const choiceMap = objectAsMap(choices)

  for (let [ name, emoji ] of Array.from(choiceMap.values())) {
    await message.react(emoji)
  }

  const reactions = await message.awaitReactions(reaction => {
    return reaction.users.find('id', user._id)
  }, {max: 1})

  const reaction = reactions.first()

  const [ key ] = Array.from(choiceMap.entries()).find(
    ([ key, [ name, emoji ] ]) => emoji === reaction.emoji.name
  )

  return key
}

async function prompt(channel, user, title, choices) {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!user) throw new TypeError('prompt(, User user) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('prompt(,,, object | Map<anything, array<string title, Emoji emoji>> choices) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(0x00AE86)
    .setDescription(Array.from(objectAsMap(choices).values()).map(([ name, emoji ]) => `${emoji} ${name}`))

  const message = await channel.send(embed)

  const choice = await promptOnMessage(message, choices, user)

  return choice
}

module.exports = { promptOnMessage, prompt }
