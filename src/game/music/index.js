import path from 'path'

// 8-bit-style music:
// https://www.youtube.com/playlist?list=PLBE459782E55DE0D8

// General royalty free music:
/*
  Kevin MacLeod (incompetech.com)
  Licensed under Creative Commons: By Attribution 3.0 License
  http://creativecommons.org/licenses/by/3.0/
*/

// Voodoo webpack magic! No hacks, though. Fun!
import battle from './mountain-emperor.mp3' // incompetech
import lonelyVoid from './truth-in-the-stones.mp3' // incompetech

const music = [
  [ 'battle', battle ],
  [ 'lonely-void', lonelyVoid ],
]

export default music
