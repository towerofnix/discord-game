// Sorry, alex! -Florrie
const { prompt, promptOnMessage } = require('./prompt')

module.exports = {
  prompt, promptOnMessage,
  richWrite: require('./richWrite'),
  delay: require('./delay'),
  log: Object.assign({},
    require('./log').log,
    require('./logFatal').log),
}
