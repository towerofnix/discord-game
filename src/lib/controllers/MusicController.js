const { Battle } = require('../Battle')
const { User } = require('../User')
const { env } = require('../env')
const { log } = require('../util')

const chalk = require('chalk')

class MusicController {
  constructor(game) {
    if (!game) throw new TypeError('new MusicController(Game game) expected')

    this.game = game

    // TODO: do sanity checks on music channels/roles
  }

  // TODO actually play music in channels using _more_ bot accounts!

  async play(song, user) {
    if (!song || typeof song !== 'string') throw new TypeError('MusicController#play(string song) expected')
    if (!user || !(user instanceof User)) throw new TypeError('MusicController#play(, User user) expected')

    if (env('music_enabled', 'boolean') === false) {
      log.warn(chalk`{yellow music_enabled} is {purple false} but MusicController#play() was called anyway`)
      return false
    }

    const member = await user.getMember(this.game.guild)

    // give user the "listening to: <song>" role so they can actually join the channel
    await member.addRole(this.game.guild.roles.find('name', `listening to: ${song}`))

    // move them to the voice channel
    // (note: setVoiceChannel cannot *put* people in voice channels if they aren't
    // already in one! no idea why that doesnt throw an error, though...)
    await member.setVoiceChannel(this.game.guild.channels.find('name', song))

    // remove previous "listening to" role
    for (let [ id, role ] of member.roles) {
      if (role.name.startsWith('listening to:') && role.name !== `listening to: ${song}`)
        await member.removeRole(id)
    }

    return true
  }
}

module.exports = { MusicController }
