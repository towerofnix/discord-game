const { RichEmbed, TextChannel, Message } = require('discord.js')
const { User } = require('../User')

async function promptOnMessage(message, choices, user) {
  if (!message || message instanceof Message === false) throw new TypeError('promptOnMessage(discord.Message message) expected')
  if (!choices || Array.isArray(choices) === false) throw new TypeError('promptOnMessage(array<array<string title, Emoji emoji>> choices) expected')
  if (!user || user instanceof User === false) throw new TypeError('prompt(,, User user) expected')

  // TODO: Can this be made simpler with async/await?
  let promise = message.awaitReactions(reaction => {
    return reaction.users.find('id', user._id)
  }, { max: 1 }).then(reactions => reactions.first().emoji.name)

  for (let [ name, emoji ] of choices) await message.react(emoji)

  return promise
}

async function prompt(channel, user, title, choices) {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!user) throw new TypeError('prompt(, User user) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!choices || !Array.isArray(choices)) throw new TypeError('prompt(,,, array<array<string title, Emoji emoji>> choices) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(0x00AE86)
    .setDescription(choices.map(([ name, emoji ]) => `${emoji} ${name}`))

  const message = await channel.send(embed)

  const choice = await promptOnMessage(message, choices, user)

  return choice
}

module.exports = { promptOnMessage, prompt }
