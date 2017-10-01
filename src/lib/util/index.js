// Sorry, alex! -Florrie
const { prompt, promptOnMessage, temporaryPrompt } = require('./prompt')

module.exports = {
  prompt, promptOnMessage, temporaryPrompt,
  richWrite: require('./richWrite'),
  delay: require('./delay'),
  log: Object.assign({},
    require('./log').log,
    require('./logFatal').log),
  checkTypes: require('./checkTypes'),
}
