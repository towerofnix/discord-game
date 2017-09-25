const { RichEmbed, TextChannel } = require('discord.js')
const { User } = require('../User')

// TODO: Rename this, lol.
async function richWrite(channel, user, color, title, content) {
  if (!channel || channel instanceof TextChannel === false) throw new TypeError('richWrite(discord.TextChannel channel) expected')
  if (!user || user instanceof User === false) throw new TypeError('richWrite(, User user) expected')
  if (!color || typeof color !== 'number') throw new TypeError('richWrite(,, number color) expected')
  if (!title || typeof title !== 'string') throw new TypeError('richWrite(,,, string title) expected')
  if (!content || typeof content !== 'string') throw new TypeError('richWrite(,,,, string content) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(color)
    .setDescription(content)

  const message = await channel.send(embed)

  return message
}

module.exports = richWrite
