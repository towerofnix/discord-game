const { registerRoom } = require('../../lib/Room')

const { LonelyVoid } = require('./LonelyVoid')

async function registerRooms() {
  await registerRoom(new LonelyVoid())
  // ..more rooms..
}

module.exports = { registerRooms }
