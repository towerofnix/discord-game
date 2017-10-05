const { RichEmbed, TextChannel } = require('discord.js')

// TODO: Rename this, lol.
async function richWrite(channel, color, title, content) {
  if (!channel || channel instanceof TextChannel === false) throw new TypeError('richWrite(discord.TextChannel channel) expected')
  if (!color) throw new TypeError('richWrite(, ColorResolvable color) expected')
  if (!title || typeof title !== 'string') throw new TypeError('richWrite(,, string title) expected')
  if (!content || typeof content !== 'string') throw new TypeError('richWrite(,,, string content) expected')

  const embed = new RichEmbed()
    .setTitle(title)
    .setColor(color)
    .setDescription(content)

  const message = await channel.send(embed)

  return message
}

module.exports = richWrite
