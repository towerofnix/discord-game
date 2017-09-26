const { RichEmbed, TextChannel, Message } = require('discord.js')
const { User } = require('../User')

async function promptOnMessage(message, choices, user) {
  if (!message || message instanceof Message === false) throw new TypeError('promptOnMessage(discord.Message message) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('promptOnMessage(object<array<string title, Emoji emoji>> choices) expected')
  if (!user || user instanceof User === false) throw new TypeError('prompt(,, User user) expected')

  for (let [ name, emoji ] of Object.values(choices)) await message.react(emoji)

  const reactions = await message.awaitReactions(reaction => {
    return reaction.users.find('id', user._id)
  }, {max: 1})

  const reaction = reactions.first()

  const [ key ] = Object.entries(choices).find(
    ([ key, [ name, emoji ] ]) => emoji === reaction.emoji.name
  )

  return key
}

async function prompt(channel, user, title, choices) {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!user) throw new TypeError('prompt(, User user) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!choices || typeof choices !== 'object') throw new TypeError('prompt(,,, object<array<string title, Emoji emoji>> choices) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(0x00AE86)
    .setDescription(Object.values(choices).map(([ name, emoji ]) => `${emoji} ${name}`))

  const message = await channel.send(embed)

  const choice = await promptOnMessage(message, choices, user)

  return choice
}

module.exports = { promptOnMessage, prompt }
