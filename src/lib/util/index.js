module.exports = {
  prompt: require('./prompt'),
  richWrite: require('./richWrite'),
  log: Object.assign({},
    require('./log').log,
    require('./logFatal').log),
}
