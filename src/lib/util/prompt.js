const { RichEmbed } = require('discord.js')

async function prompt(channel, user, title, choices) {
  if (!channel) throw new TypeError('prompt(discord.TextChannel channel) expected')
  if (!user) throw new TypeError('prompt(, User user) expected')
  if (!title || typeof title !== 'string') throw new TypeError('prompt(,, string title) expected')
  if (!choices || !Array.isArray(choices)) throw new TypeError('prompt(,,, array<array<string title, Emoji emoji>> choices) expected')

  let embed = new RichEmbed()
    .setTitle(title)
    .setColor(0x00AE86)
    .setDescription(choices.map(([ name, emoji ]) => `${emoji} ${name}`))

  let msg = await channel.send(embed)

  let promise = msg.awaitReactions(reaction => {
    return reaction.users.find('id', user._id)
  }, { max: 1 }).then(reactions => reactions.first().emoji.name)

  for (let [ name, emoji ] of choices) await msg.react(emoji)

  return promise
}

module.exports = prompt
