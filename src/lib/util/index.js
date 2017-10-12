// Sorry, alex! -Florrie

import * as log from './log'
export { log }

import checkTypes from './checkTypes'
export { checkTypes }

import env from './env'
export { env }

import showMenu from './showMenu'
export { showMenu }

/*
const { prompt, promptOnMessage, temporaryPrompt } = require('./prompt')

module.exports = {
  prompt, promptOnMessage, temporaryPrompt,
  richWrite: require('./richWrite'),
  delay: require('./delay'),
  log: Object.assign({},
    require('./log').log,
    require('./logFatal').log),
  showMenu: require('./showMenu'),
  checkTypes: require('./checkTypes'),
}
*/
